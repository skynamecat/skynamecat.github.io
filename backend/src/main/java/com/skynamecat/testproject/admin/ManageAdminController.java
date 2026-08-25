package com.skynamecat.testproject.admin;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import com.skynamecat.testproject.conversation.entity.UnmatchedUtterance;
import com.skynamecat.testproject.conversation.repository.UnmatchedUtteranceRepository;
import com.skynamecat.testproject.dialogue.entity.DialogueIntent;
import com.skynamecat.testproject.dialogue.entity.DialogueReply;
import com.skynamecat.testproject.dialogue.entity.DialogueTrigger;
import com.skynamecat.testproject.dialogue.entity.MatchType;
import com.skynamecat.testproject.dialogue.repository.DialogueIntentRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueReplyRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueTriggerRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/manage")
public class ManageAdminController {

    private final DialogueIntentRepository intentRepository;
    private final DialogueTriggerRepository triggerRepository;
    private final DialogueReplyRepository replyRepository;
    private final UnmatchedUtteranceRepository unmatchedRepository;

    public ManageAdminController(
            DialogueIntentRepository intentRepository,
            DialogueTriggerRepository triggerRepository,
            DialogueReplyRepository replyRepository,
            UnmatchedUtteranceRepository unmatchedRepository
    ) {
        this.intentRepository = intentRepository;
        this.triggerRepository = triggerRepository;
        this.replyRepository = replyRepository;
        this.unmatchedRepository = unmatchedRepository;
    }

    @GetMapping({"", "/"})
    String dashboard(Model model) {
        List<UnmatchedUtterance> unmatched = unmatchedRepository.findAllByOrderByResolvedAscLastSeenAtDesc();
        model.addAttribute("intentCount", intentRepository.count());
        model.addAttribute("triggerCount", triggerRepository.count());
        model.addAttribute("replyCount", replyRepository.count());
        model.addAttribute("unresolvedCount", unmatched.stream().filter(item -> !item.isResolved()).count());
        model.addAttribute("recentUnmatched", unmatched.stream().filter(item -> !item.isResolved()).limit(5).toList());
        return "manage/dashboard";
    }

    @GetMapping("/intents")
    String intents(Model model) {
        model.addAttribute("intents", intentRepository.findAllSummaries());
        return "manage/intents";
    }

    @PostMapping("/intents")
    String createIntent(
            @RequestParam String code,
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String description,
            @RequestParam(defaultValue = "0") int priority,
            RedirectAttributes redirect
    ) {
        String normalizedCode = code.trim().toLowerCase();
        if (!normalizedCode.matches("[a-z0-9][a-z0-9_.-]{1,63}")) {
            return fail(redirect, "/manage/intents", "意图代码需为 2–64 位小写字母、数字、点、横线或下划线。");
        }
        if (name.isBlank()) {
            return fail(redirect, "/manage/intents", "意图名称不能为空。");
        }
        DialogueIntent intent = new DialogueIntent();
        intent.setCode(normalizedCode);
        intent.setName(name.trim());
        intent.setDescription(description.trim());
        intent.setPriority(priority);
        try {
            intentRepository.save(intent);
        } catch (DataIntegrityViolationException ex) {
            return fail(redirect, "/manage/intents", "意图代码已经存在。");
        }
        redirect.addFlashAttribute("success", "意图已创建，现在可以添加触发规则和回答。");
        return "redirect:/manage/intents/" + intent.getId();
    }

    @GetMapping("/intents/{intentId}")
    String intentDetail(@PathVariable Long intentId, Model model) {
        DialogueIntent intent = requireIntent(intentId);
        model.addAttribute("intent", intent);
        model.addAttribute("triggers", triggerRepository.findByIntentIdOrderByIdAsc(intentId));
        model.addAttribute("replies", replyRepository.findByIntentIdOrderByIdAsc(intentId));
        model.addAttribute("matchTypes", MatchType.values());
        return "manage/intent-detail";
    }

    @PostMapping("/intents/{intentId}")
    String updateIntent(
            @PathVariable Long intentId,
            @RequestParam String name,
            @RequestParam(required = false, defaultValue = "") String description,
            @RequestParam(defaultValue = "0") int priority,
            @RequestParam(defaultValue = "false") boolean enabled,
            RedirectAttributes redirect
    ) {
        if (name.isBlank()) {
            return fail(redirect, intentPath(intentId), "意图名称不能为空。");
        }
        DialogueIntent intent = requireIntent(intentId);
        intent.setName(name.trim());
        intent.setDescription(description.trim());
        intent.setPriority(priority);
        intent.setEnabled(enabled);
        intentRepository.save(intent);
        redirect.addFlashAttribute("success", "意图设置已保存。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/delete")
    String deleteIntent(@PathVariable Long intentId, RedirectAttributes redirect) {
        DialogueIntent intent = requireIntent(intentId);
        intentRepository.delete(intent);
        redirect.addFlashAttribute("success", "意图“" + intent.getName() + "”已删除。");
        return "redirect:/manage/intents";
    }

    @PostMapping("/intents/{intentId}/triggers")
    String createTrigger(
            @PathVariable Long intentId,
            @RequestParam MatchType matchType,
            @RequestParam String pattern,
            @RequestParam(defaultValue = "1.000") BigDecimal weight,
            RedirectAttributes redirect
    ) {
        String error = validateTrigger(matchType, pattern, weight);
        if (error != null) {
            return fail(redirect, intentPath(intentId), error);
        }
        DialogueTrigger trigger = new DialogueTrigger();
        trigger.setIntent(requireIntent(intentId));
        trigger.setMatchType(matchType);
        trigger.setPattern(pattern.trim());
        trigger.setWeight(weight);
        triggerRepository.save(trigger);
        redirect.addFlashAttribute("success", "触发规则已添加。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/triggers/{triggerId}")
    String updateTrigger(
            @PathVariable Long intentId,
            @PathVariable Long triggerId,
            @RequestParam MatchType matchType,
            @RequestParam String pattern,
            @RequestParam(defaultValue = "1.000") BigDecimal weight,
            @RequestParam(defaultValue = "false") boolean enabled,
            RedirectAttributes redirect
    ) {
        String error = validateTrigger(matchType, pattern, weight);
        if (error != null) {
            return fail(redirect, intentPath(intentId), error);
        }
        DialogueTrigger trigger = requireTrigger(intentId, triggerId);
        trigger.setMatchType(matchType);
        trigger.setPattern(pattern.trim());
        trigger.setWeight(weight);
        trigger.setEnabled(enabled);
        triggerRepository.save(trigger);
        redirect.addFlashAttribute("success", "触发规则已保存。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/triggers/{triggerId}/delete")
    String deleteTrigger(@PathVariable Long intentId, @PathVariable Long triggerId, RedirectAttributes redirect) {
        triggerRepository.delete(requireTrigger(intentId, triggerId));
        redirect.addFlashAttribute("success", "触发规则已删除。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/replies")
    String createReply(
            @PathVariable Long intentId,
            @RequestParam String content,
            @RequestParam(defaultValue = "1") int weight,
            RedirectAttributes redirect
    ) {
        String error = validateReply(content, weight);
        if (error != null) {
            return fail(redirect, intentPath(intentId), error);
        }
        DialogueReply reply = new DialogueReply();
        reply.setIntent(requireIntent(intentId));
        reply.setContent(content.trim());
        reply.setWeight(weight);
        replyRepository.save(reply);
        redirect.addFlashAttribute("success", "回答已添加。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/replies/{replyId}")
    String updateReply(
            @PathVariable Long intentId,
            @PathVariable Long replyId,
            @RequestParam String content,
            @RequestParam(defaultValue = "1") int weight,
            @RequestParam(defaultValue = "false") boolean enabled,
            RedirectAttributes redirect
    ) {
        String error = validateReply(content, weight);
        if (error != null) {
            return fail(redirect, intentPath(intentId), error);
        }
        DialogueReply reply = requireReply(intentId, replyId);
        reply.setContent(content.trim());
        reply.setWeight(weight);
        reply.setEnabled(enabled);
        replyRepository.save(reply);
        redirect.addFlashAttribute("success", "回答已保存。");
        return "redirect:" + intentPath(intentId);
    }

    @PostMapping("/intents/{intentId}/replies/{replyId}/delete")
    String deleteReply(@PathVariable Long intentId, @PathVariable Long replyId, RedirectAttributes redirect) {
        replyRepository.delete(requireReply(intentId, replyId));
        redirect.addFlashAttribute("success", "回答已删除。");
        return "redirect:" + intentPath(intentId);
    }

    @GetMapping("/unmatched")
    String unmatched(Model model) {
        model.addAttribute("items", unmatchedRepository.findAllByOrderByResolvedAscLastSeenAtDesc());
        return "manage/unmatched";
    }

    @PostMapping("/unmatched/{id}/resolved")
    String setResolved(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean resolved,
            RedirectAttributes redirect
    ) {
        UnmatchedUtterance item = unmatchedRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("未找到该问题"));
        item.setResolved(resolved);
        unmatchedRepository.save(item);
        redirect.addFlashAttribute("success", resolved ? "已标记为处理完成。" : "已重新打开该问题。");
        return "redirect:/manage/unmatched";
    }

    private DialogueIntent requireIntent(Long id) {
        return intentRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("未找到该意图"));
    }

    private DialogueTrigger requireTrigger(Long intentId, Long triggerId) {
        DialogueTrigger trigger = triggerRepository.findById(triggerId)
                .orElseThrow(() -> new IllegalArgumentException("未找到该触发规则"));
        if (!trigger.getIntent().getId().equals(intentId)) {
            throw new IllegalArgumentException("触发规则不属于该意图");
        }
        return trigger;
    }

    private DialogueReply requireReply(Long intentId, Long replyId) {
        DialogueReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("未找到该回答"));
        if (!reply.getIntent().getId().equals(intentId)) {
            throw new IllegalArgumentException("回答不属于该意图");
        }
        return reply;
    }

    private String validateTrigger(MatchType matchType, String pattern, BigDecimal weight) {
        if (pattern.isBlank()) return "触发内容不能为空。";
        if (pattern.length() > 500) return "触发内容不能超过 500 个字符。";
        if (weight.compareTo(new BigDecimal("0.001")) < 0 || weight.compareTo(BigDecimal.ONE) > 0) {
            return "规则权重需在 0.001–1.000 之间。";
        }
        if (matchType == MatchType.REGEX) {
            try {
                Pattern.compile(pattern);
            } catch (PatternSyntaxException ex) {
                return "正则表达式无效：" + ex.getDescription();
            }
        }
        return null;
    }

    private String validateReply(String content, int weight) {
        if (content.isBlank()) return "回答内容不能为空。";
        if (weight < 1 || weight > 100) return "回答权重需在 1–100 之间。";
        return null;
    }

    private String fail(RedirectAttributes redirect, String path, String message) {
        redirect.addFlashAttribute("error", message);
        return "redirect:" + path;
    }

    private String intentPath(Long intentId) {
        return "/manage/intents/" + intentId;
    }
}
