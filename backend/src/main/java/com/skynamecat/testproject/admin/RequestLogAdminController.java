package com.skynamecat.testproject.admin;

import com.skynamecat.testproject.conversation.repository.ConversationMessageRepository;
import com.skynamecat.testproject.observability.RequestLog;
import com.skynamecat.testproject.observability.RequestLogRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Controller
@RequestMapping("/manage/requests")
public class RequestLogAdminController {
    private final RequestLogRepository requestLogRepository;
    private final ConversationMessageRepository messageRepository;

    public RequestLogAdminController(
            RequestLogRepository requestLogRepository,
            ConversationMessageRepository messageRepository
    ) {
        this.requestLogRepository = requestLogRepository;
        this.messageRepository = messageRepository;
    }

    @GetMapping
    String requests(Model model) {
        model.addAttribute("requests", requestLogRepository.findTop200ByOrderByCreatedAtDesc());
        return "manage/requests";
    }

    @GetMapping("/{requestId}")
    String requestDetail(@PathVariable UUID requestId, Model model) {
        RequestLog request = requestLogRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("未找到该请求记录"));
        model.addAttribute("request", request);
        model.addAttribute("messages", messageRepository.findByRequestIdOrderByCreatedAtAsc(requestId));
        return "manage/request-detail";
    }
}
