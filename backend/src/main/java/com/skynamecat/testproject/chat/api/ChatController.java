package com.skynamecat.testproject.chat.api;

import com.skynamecat.testproject.chat.service.ChatService;
import com.skynamecat.testproject.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ApiResponse<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ApiResponse.success(chatService.chat(request));
    }
}
