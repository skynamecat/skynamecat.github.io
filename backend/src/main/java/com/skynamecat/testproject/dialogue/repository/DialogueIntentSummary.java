package com.skynamecat.testproject.dialogue.repository;

public record DialogueIntentSummary(
        Long id,
        String code,
        String name,
        int priority,
        boolean enabled,
        long triggerCount,
        long replyCount
) {
}
