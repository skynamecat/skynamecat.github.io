package com.skynamecat.testproject.chat.provider;

import com.skynamecat.testproject.chat.model.ChatReply;
import com.skynamecat.testproject.common.text.TextNormalizer;
import com.skynamecat.testproject.dialogue.entity.DialogueIntent;
import com.skynamecat.testproject.dialogue.entity.DialogueReply;
import com.skynamecat.testproject.dialogue.entity.DialogueTrigger;
import com.skynamecat.testproject.dialogue.repository.DialogueIntentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Service
public class PresetChatProvider implements ChatProvider {

    private static final Logger log = LoggerFactory.getLogger(PresetChatProvider.class);
    private static final String PROVIDER = "preset";
    private static final String FALLBACK_CODE = "fallback";
    private static final String SAFE_FALLBACK = "这个问题我暂时还不会回答，不过已经记下来了。";

    private final DialogueIntentRepository intentRepository;

    public PresetChatProvider(DialogueIntentRepository intentRepository) {
        this.intentRepository = intentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ChatReply reply(String message) {
        String normalized = TextNormalizer.normalize(message);
        return intentRepository.findDistinctByEnabledTrueOrderByPriorityDescIdAsc().stream()
                .filter(intent -> !FALLBACK_CODE.equals(intent.getCode()))
                .map(intent -> new IntentMatch(intent, score(intent, normalized)))
                .filter(match -> match.score().signum() > 0)
                .max(Comparator.comparing(IntentMatch::score)
                        .thenComparing(match -> match.intent().getPriority()))
                .map(this::toReply)
                .orElseGet(this::fallback);
    }

    private BigDecimal score(DialogueIntent intent, String normalizedMessage) {
        return intent.getTriggers().stream()
                .filter(DialogueTrigger::isEnabled)
                .map(trigger -> score(trigger, normalizedMessage))
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal score(DialogueTrigger trigger, String normalizedMessage) {
        String normalizedPattern = TextNormalizer.normalize(trigger.getPattern());
        boolean matches;
        BigDecimal base;

        switch (trigger.getMatchType()) {
            case EXACT -> {
                matches = normalizedMessage.equals(normalizedPattern);
                base = BigDecimal.ONE;
            }
            case KEYWORD -> {
                matches = !normalizedPattern.isBlank() && normalizedMessage.contains(normalizedPattern);
                base = new BigDecimal("0.850");
            }
            case REGEX -> {
                try {
                    matches = Pattern.compile(trigger.getPattern(), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                            .matcher(normalizedMessage)
                            .find();
                } catch (PatternSyntaxException exception) {
                    log.warn("Ignoring invalid dialogue trigger regex id={}: {}", trigger.getId(), exception.getMessage());
                    matches = false;
                }
                base = new BigDecimal("0.900");
            }
            default -> throw new IllegalStateException("Unsupported match type: " + trigger.getMatchType());
        }

        if (!matches) {
            return BigDecimal.ZERO;
        }
        BigDecimal weight = trigger.getWeight() == null ? BigDecimal.ONE : trigger.getWeight();
        return base.multiply(weight).min(BigDecimal.ONE).setScale(4, RoundingMode.HALF_UP);
    }

    private ChatReply toReply(IntentMatch match) {
        String answer = selectReply(match.intent().getReplies());
        if (answer == null) {
            return fallback();
        }
        return new ChatReply(answer, PROVIDER, match.intent().getCode(), match.score());
    }

    private ChatReply fallback() {
        return intentRepository.findByCode(FALLBACK_CODE)
                .filter(DialogueIntent::isEnabled)
                .map(intent -> selectReply(intent.getReplies()))
                .filter(answer -> answer != null && !answer.isBlank())
                .map(answer -> new ChatReply(answer, PROVIDER, FALLBACK_CODE, BigDecimal.ZERO.setScale(4)))
                .orElseGet(() -> new ChatReply(
                        SAFE_FALLBACK,
                        PROVIDER,
                        FALLBACK_CODE,
                        BigDecimal.ZERO.setScale(4)
                ));
    }

    private String selectReply(List<DialogueReply> replies) {
        List<DialogueReply> enabled = replies.stream()
                .filter(DialogueReply::isEnabled)
                .filter(reply -> reply.getContent() != null && !reply.getContent().isBlank())
                .toList();
        if (enabled.isEmpty()) {
            return null;
        }

        int totalWeight = enabled.stream().mapToInt(reply -> Math.max(1, reply.getWeight())).sum();
        int selected = ThreadLocalRandom.current().nextInt(totalWeight);
        for (DialogueReply reply : enabled) {
            selected -= Math.max(1, reply.getWeight());
            if (selected < 0) {
                return reply.getContent();
            }
        }
        return enabled.getLast().getContent();
    }

    private record IntentMatch(DialogueIntent intent, BigDecimal score) {
    }
}
