package com.skynamecat.testproject.chat.model;

import java.math.BigDecimal;

public record ChatReply(
        String answer,
        String provider,
        String intent,
        BigDecimal confidence
) {
    public boolean unmatched() {
        return "fallback".equals(intent);
    }
}
