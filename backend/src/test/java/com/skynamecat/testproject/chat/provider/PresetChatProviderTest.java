package com.skynamecat.testproject.chat.provider;

import com.skynamecat.testproject.dialogue.entity.DialogueIntent;
import com.skynamecat.testproject.dialogue.entity.DialogueReply;
import com.skynamecat.testproject.dialogue.entity.DialogueTrigger;
import com.skynamecat.testproject.dialogue.entity.MatchType;
import com.skynamecat.testproject.dialogue.repository.DialogueIntentRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PresetChatProviderTest {

    private final DialogueIntentRepository repository = mock(DialogueIntentRepository.class);
    private final PresetChatProvider provider = new PresetChatProvider(repository);

    @Test
    void matchesNormalizedKeywordAndReturnsPresetReply() {
        DialogueIntent greeting = intent("greeting", "你好呀");
        DialogueTrigger trigger = new DialogueTrigger();
        trigger.setMatchType(MatchType.KEYWORD);
        trigger.setPattern("你好");
        trigger.setWeight(BigDecimal.ONE);
        greeting.addTrigger(trigger);
        when(repository.findDistinctByEnabledTrueOrderByPriorityDescIdAsc()).thenReturn(List.of(greeting));

        var reply = provider.reply("  你 好  ".replace(" ", ""));

        assertThat(reply.intent()).isEqualTo("greeting");
        assertThat(reply.answer()).isEqualTo("你好呀");
        assertThat(reply.provider()).isEqualTo("preset");
        assertThat(reply.confidence()).isEqualByComparingTo("0.8500");
    }

    @Test
    void fallsBackWhenNoTriggerMatches() {
        DialogueIntent fallback = intent("fallback", "我先记下来");
        when(repository.findDistinctByEnabledTrueOrderByPriorityDescIdAsc()).thenReturn(List.of());
        when(repository.findByCode("fallback")).thenReturn(Optional.of(fallback));

        var reply = provider.reply("一个尚未预制的问题");

        assertThat(reply.intent()).isEqualTo("fallback");
        assertThat(reply.answer()).isEqualTo("我先记下来");
        assertThat(reply.confidence()).isZero();
    }

    @Test
    void ignoresInvalidRegularExpression() {
        DialogueIntent broken = intent("broken", "不应命中");
        DialogueTrigger trigger = new DialogueTrigger();
        trigger.setMatchType(MatchType.REGEX);
        trigger.setPattern("[");
        trigger.setWeight(BigDecimal.ONE);
        broken.addTrigger(trigger);
        DialogueIntent fallback = intent("fallback", "兜底");
        when(repository.findDistinctByEnabledTrueOrderByPriorityDescIdAsc()).thenReturn(List.of(broken));
        when(repository.findByCode("fallback")).thenReturn(Optional.of(fallback));

        assertThat(provider.reply("任意消息").answer()).isEqualTo("兜底");
    }

    private DialogueIntent intent(String code, String answer) {
        DialogueIntent intent = new DialogueIntent();
        intent.setCode(code);
        intent.setName(code);
        intent.setEnabled(true);
        DialogueReply reply = new DialogueReply();
        reply.setContent(answer);
        reply.setWeight(1);
        reply.setEnabled(true);
        intent.addReply(reply);
        return intent;
    }
}
