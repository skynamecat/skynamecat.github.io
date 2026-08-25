package com.skynamecat.testproject.admin;

import com.skynamecat.testproject.common.api.ApiResponse;
import com.skynamecat.testproject.conversation.entity.ConversationMessage;
import com.skynamecat.testproject.conversation.entity.UnmatchedUtterance;
import com.skynamecat.testproject.conversation.repository.ConversationMessageRepository;
import com.skynamecat.testproject.conversation.repository.UnmatchedUtteranceRepository;
import com.skynamecat.testproject.dialogue.entity.DialogueIntent;
import com.skynamecat.testproject.dialogue.entity.DialogueReply;
import com.skynamecat.testproject.dialogue.entity.DialogueTrigger;
import com.skynamecat.testproject.dialogue.entity.MatchType;
import com.skynamecat.testproject.dialogue.repository.DialogueIntentRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueReplyRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueTriggerRepository;
import com.skynamecat.testproject.observability.RequestLog;
import com.skynamecat.testproject.observability.RequestLogRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.PatternSyntaxException;

@RestController
@RequestMapping("/api/admin/dialogue")
public class DialogueAdminApiController {
    private final DialogueIntentRepository intents;
    private final DialogueTriggerRepository triggers;
    private final DialogueReplyRepository replies;
    private final UnmatchedUtteranceRepository unmatched;
    private final RequestLogRepository requests;
    private final ConversationMessageRepository messages;

    public DialogueAdminApiController(DialogueIntentRepository intents, DialogueTriggerRepository triggers,
                                      DialogueReplyRepository replies, UnmatchedUtteranceRepository unmatched,
                                      RequestLogRepository requests, ConversationMessageRepository messages) {
        this.intents = intents;
        this.triggers = triggers;
        this.replies = replies;
        this.unmatched = unmatched;
        this.requests = requests;
        this.messages = messages;
    }

    @GetMapping("/overview")
    ApiResponse<?> overview() {
        var items = unmatched.findAllByOrderByResolvedAscLastSeenAtDesc();
        return ApiResponse.success(Map.of(
                "intentCount", intents.count(),
                "triggerCount", triggers.count(),
                "replyCount", replies.count(),
                "unresolvedCount", items.stream().filter(item -> !item.isResolved()).count(),
                "recentUnmatched", items.stream().filter(item -> !item.isResolved()).limit(5).map(this::unmatchedView).toList()
        ));
    }

    @GetMapping("/intents")
    @Transactional(readOnly = true)
    ApiResponse<?> listIntents() {
        return ApiResponse.success(intents.findAllByOrderByPriorityDescNameAsc().stream().map(this::intentView).toList());
    }

    @PostMapping("/intents")
    @Transactional
    ApiResponse<?> createIntent(@Valid @RequestBody IntentInput input) {
        DialogueIntent intent = new DialogueIntent();
        intent.setCode(input.code().trim().toLowerCase());
        apply(intent, input);
        try { return ApiResponse.success(intentView(intents.save(intent))); }
        catch (DataIntegrityViolationException exception) { throw new IllegalArgumentException("意图代码已经存在"); }
    }

    @PutMapping("/intents/{intentId}")
    @Transactional
    ApiResponse<?> updateIntent(@PathVariable Long intentId, @Valid @RequestBody IntentInput input) {
        DialogueIntent intent = requireIntent(intentId);
        apply(intent, input);
        return ApiResponse.success(intentView(intents.save(intent)));
    }

    @DeleteMapping("/intents/{intentId}")
    @Transactional
    ApiResponse<?> deleteIntent(@PathVariable Long intentId) {
        intents.delete(requireIntent(intentId));
        return ApiResponse.success(Map.of("deleted", true));
    }

    @PostMapping("/intents/{intentId}/triggers")
    @Transactional
    ApiResponse<?> createTrigger(@PathVariable Long intentId, @Valid @RequestBody TriggerInput input) {
        validateRegex(input);
        DialogueTrigger trigger = new DialogueTrigger();
        trigger.setIntent(requireIntent(intentId));
        apply(trigger, input);
        return ApiResponse.success(triggerView(triggers.save(trigger)));
    }

    @PutMapping("/intents/{intentId}/triggers/{triggerId}")
    @Transactional
    ApiResponse<?> updateTrigger(@PathVariable Long intentId, @PathVariable Long triggerId,
                                 @Valid @RequestBody TriggerInput input) {
        validateRegex(input);
        DialogueTrigger trigger = requireTrigger(intentId, triggerId);
        apply(trigger, input);
        return ApiResponse.success(triggerView(triggers.save(trigger)));
    }

    @DeleteMapping("/intents/{intentId}/triggers/{triggerId}")
    @Transactional
    ApiResponse<?> deleteTrigger(@PathVariable Long intentId, @PathVariable Long triggerId) {
        triggers.delete(requireTrigger(intentId, triggerId));
        return ApiResponse.success(Map.of("deleted", true));
    }

    @PostMapping("/intents/{intentId}/replies")
    @Transactional
    ApiResponse<?> createReply(@PathVariable Long intentId, @Valid @RequestBody ReplyInput input) {
        DialogueReply reply = new DialogueReply();
        reply.setIntent(requireIntent(intentId));
        apply(reply, input);
        return ApiResponse.success(replyView(replies.save(reply)));
    }

    @PutMapping("/intents/{intentId}/replies/{replyId}")
    @Transactional
    ApiResponse<?> updateReply(@PathVariable Long intentId, @PathVariable Long replyId,
                               @Valid @RequestBody ReplyInput input) {
        DialogueReply reply = requireReply(intentId, replyId);
        apply(reply, input);
        return ApiResponse.success(replyView(replies.save(reply)));
    }

    @DeleteMapping("/intents/{intentId}/replies/{replyId}")
    @Transactional
    ApiResponse<?> deleteReply(@PathVariable Long intentId, @PathVariable Long replyId) {
        replies.delete(requireReply(intentId, replyId));
        return ApiResponse.success(Map.of("deleted", true));
    }

    @GetMapping("/unmatched")
    ApiResponse<?> listUnmatched() {
        return ApiResponse.success(unmatched.findAllByOrderByResolvedAscLastSeenAtDesc().stream().map(this::unmatchedView).toList());
    }

    @PatchMapping("/unmatched/{id}")
    ApiResponse<?> resolve(@PathVariable Long id, @RequestBody ResolveInput input) {
        UnmatchedUtterance item = unmatched.findById(id).orElseThrow(() -> new IllegalArgumentException("未找到该问题"));
        item.setResolved(input.resolved());
        return ApiResponse.success(unmatchedView(unmatched.save(item)));
    }

    @GetMapping("/requests")
    ApiResponse<?> requestLogs() {
        return ApiResponse.success(requests.findTop200ByOrderByCreatedAtDesc().stream().map(this::requestView).toList());
    }

    @GetMapping("/requests/{requestId}")
    ApiResponse<?> requestDetail(@PathVariable UUID requestId) {
        RequestLog request = requests.findById(requestId).orElseThrow(() -> new IllegalArgumentException("未找到该请求记录"));
        return ApiResponse.success(new RequestDetail(requestView(request),
                messages.findByRequestIdOrderByCreatedAtAsc(requestId).stream().map(this::messageView).toList()));
    }

    private void apply(DialogueIntent intent, IntentInput input) {
        intent.setName(input.name().trim());
        intent.setDescription(input.description() == null ? "" : input.description().trim());
        intent.setPriority(input.priority());
        intent.setEnabled(input.enabled());
    }

    private void apply(DialogueTrigger trigger, TriggerInput input) {
        trigger.setMatchType(input.matchType());
        trigger.setPattern(input.pattern().trim());
        trigger.setWeight(input.weight());
        trigger.setEnabled(input.enabled());
    }

    private void apply(DialogueReply reply, ReplyInput input) {
        reply.setContent(input.content().trim());
        reply.setWeight(input.weight());
        reply.setEnabled(input.enabled());
    }

    private void validateRegex(TriggerInput input) {
        if (input.matchType() != MatchType.REGEX) return;
        try { java.util.regex.Pattern.compile(input.pattern()); }
        catch (PatternSyntaxException exception) { throw new IllegalArgumentException("正则表达式无效：" + exception.getDescription()); }
    }

    private DialogueIntent requireIntent(Long id) {
        return intents.findById(id).orElseThrow(() -> new IllegalArgumentException("未找到该意图"));
    }

    private DialogueTrigger requireTrigger(Long intentId, Long id) {
        DialogueTrigger item = triggers.findById(id).orElseThrow(() -> new IllegalArgumentException("未找到该触发规则"));
        if (!item.getIntent().getId().equals(intentId)) throw new IllegalArgumentException("触发规则不属于该意图");
        return item;
    }

    private DialogueReply requireReply(Long intentId, Long id) {
        DialogueReply item = replies.findById(id).orElseThrow(() -> new IllegalArgumentException("未找到该回答"));
        if (!item.getIntent().getId().equals(intentId)) throw new IllegalArgumentException("回答不属于该意图");
        return item;
    }

    private IntentView intentView(DialogueIntent item) {
        return new IntentView(item.getId(), item.getCode(), item.getName(), item.getDescription(), item.getPriority(),
                item.isEnabled(), item.getUpdatedAt(), item.getTriggers().stream().map(this::triggerView).toList(),
                item.getReplies().stream().map(this::replyView).toList());
    }

    private TriggerView triggerView(DialogueTrigger item) {
        return new TriggerView(item.getId(), item.getMatchType(), item.getPattern(), item.getWeight(), item.isEnabled());
    }

    private ReplyView replyView(DialogueReply item) {
        return new ReplyView(item.getId(), item.getContent(), item.getWeight(), item.isEnabled());
    }

    private UnmatchedView unmatchedView(UnmatchedUtterance item) {
        return new UnmatchedView(item.getId(), item.getContent(), item.getOccurrences(), item.isResolved(), item.getFirstSeenAt(), item.getLastSeenAt());
    }

    private RequestView requestView(RequestLog item) {
        return new RequestView(item.getId(), item.getSessionId(), item.getActor(), item.getMethod(), item.getPath(),
                item.getStatusCode(), item.getDurationMs(), item.getClientIp(), item.getUserAgent(), item.getCreatedAt());
    }

    private MessageView messageView(ConversationMessage item) {
        return new MessageView(item.getId(), item.getRole().name(), item.getContent(), item.getProvider(),
                item.getIntentCode(), item.getConfidence(), item.getCreatedAt());
    }

    public record IntentInput(@NotBlank @Pattern(regexp = "[a-z0-9][a-z0-9_.-]{1,63}") String code,
                              @NotBlank @Size(max = 120) String name, @Size(max = 500) String description,
                              int priority, boolean enabled) {}
    public record TriggerInput(@NotNull MatchType matchType, @NotBlank @Size(max = 500) String pattern,
                               @NotNull @Min(0) @Max(1) BigDecimal weight, boolean enabled) {}
    public record ReplyInput(@NotBlank String content, @Min(1) @Max(100) int weight, boolean enabled) {}
    public record ResolveInput(boolean resolved) {}
    public record IntentView(Long id, String code, String name, String description, int priority, boolean enabled,
                             Instant updatedAt, List<TriggerView> triggers, List<ReplyView> replies) {}
    public record TriggerView(Long id, MatchType matchType, String pattern, BigDecimal weight, boolean enabled) {}
    public record ReplyView(Long id, String content, int weight, boolean enabled) {}
    public record UnmatchedView(Long id, String content, int occurrences, boolean resolved, Instant firstSeenAt, Instant lastSeenAt) {}
    public record RequestView(UUID id, UUID sessionId, String actor, String method, String path, int statusCode,
                              long durationMs, String clientIp, String userAgent, Instant createdAt) {}
    public record MessageView(UUID id, String role, String content, String provider, String intentCode,
                              BigDecimal confidence, Instant createdAt) {}
    public record RequestDetail(RequestView request, List<MessageView> messages) {}
}
