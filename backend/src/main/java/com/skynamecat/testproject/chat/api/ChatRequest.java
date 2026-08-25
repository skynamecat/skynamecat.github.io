package com.skynamecat.testproject.chat.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        String sessionId,
        @NotBlank(message = "message must not be blank")
        @Size(max = 1000, message = "message must not exceed 1000 characters")
        String message
) {
}
