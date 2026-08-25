package com.skynamecat.testproject.dialogue.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "dialogue_trigger")
public class DialogueTrigger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intent_id", nullable = false)
    private DialogueIntent intent;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false, length = 20)
    private MatchType matchType;

    @Column(nullable = false, length = 500)
    private String pattern;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal weight = BigDecimal.ONE;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public DialogueIntent getIntent() { return intent; }
    public void setIntent(DialogueIntent intent) { this.intent = intent; }
    public MatchType getMatchType() { return matchType; }
    public void setMatchType(MatchType matchType) { this.matchType = matchType; }
    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }
    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
