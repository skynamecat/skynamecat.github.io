package com.skynamecat.testproject.chat.api;

import java.math.BigDecimal;

public record ChatResponse(
        String sessionId,
        String messageId,
        String answer,
        String provider,
        String intent,
        BigDecimal confidence
) {
}
