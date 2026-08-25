package com.skynamecat.testproject.conversation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "unmatched_utterance")
public class UnmatchedUtterance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ConversationSession session;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "normalized_content", nullable = false, unique = true, length = 1000)
    private String normalizedContent;

    @Column(nullable = false)
    private int occurrences;

    @Column(nullable = false)
    private boolean resolved;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    public Long getId() { return id; }
    public ConversationSession getSession() { return session; }
    public UUID getMessageId() { return messageId; }
    public String getContent() { return content; }
    public String getNormalizedContent() { return normalizedContent; }
    public int getOccurrences() { return occurrences; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public Instant getFirstSeenAt() { return firstSeenAt; }
    public Instant getLastSeenAt() { return lastSeenAt; }
}
