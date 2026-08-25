package com.skynamecat.testproject.conversation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_message")
public class ConversationMessage {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ConversationSession session;

    @Column(name = "request_id")
    private UUID requestId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(length = 40)
    private String provider;

    @Column(name = "intent_code", length = 64)
    private String intentCode;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ConversationMessage() {
    }

    private ConversationMessage(ConversationSession session, UUID requestId, MessageRole role, String content) {
        this.session = session;
        this.requestId = requestId;
        this.role = role;
        this.content = content;
    }

    public static ConversationMessage user(ConversationSession session, UUID requestId, String content) {
        return new ConversationMessage(session, requestId, MessageRole.USER, content);
    }

    public static ConversationMessage assistant(
            ConversationSession session,
            UUID requestId,
            String content,
            String provider,
            String intentCode,
            BigDecimal confidence
    ) {
        ConversationMessage message = new ConversationMessage(session, requestId, MessageRole.ASSISTANT, content);
        message.provider = provider;
        message.intentCode = intentCode;
        message.confidence = confidence;
        return message;
    }

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public ConversationSession getSession() { return session; }
    public UUID getRequestId() { return requestId; }
    public MessageRole getRole() { return role; }
    public String getContent() { return content; }
    public String getProvider() { return provider; }
    public String getIntentCode() { return intentCode; }
    public BigDecimal getConfidence() { return confidence; }
    public Instant getCreatedAt() { return createdAt; }
}
