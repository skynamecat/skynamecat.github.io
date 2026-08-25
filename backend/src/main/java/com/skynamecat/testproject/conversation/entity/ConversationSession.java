package com.skynamecat.testproject.conversation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_session")
public class ConversationSession {

    @Id
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_active_at", nullable = false)
    private Instant lastActiveAt;

    protected ConversationSession() {
    }

    public ConversationSession(UUID id) {
        this.id = id;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        lastActiveAt = now;
    }

    @PreUpdate
    void preUpdate() { lastActiveAt = Instant.now(); }

    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastActiveAt() { return lastActiveAt; }
    public void touch() { lastActiveAt = Instant.now(); }
}
