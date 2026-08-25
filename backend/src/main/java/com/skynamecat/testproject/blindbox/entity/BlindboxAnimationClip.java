package com.skynamecat.testproject.blindbox.entity;

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

import java.time.Instant;

@Entity
@Table(name = "blindbox_animation_clip")
public class BlindboxAnimationClip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clip_key", nullable = false, unique = true, length = 80)
    private String clipKey;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_asset_id")
    private ModelAsset sourceAsset;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "model_url", nullable = false, length = 1000)
    private String modelUrl = "/pangbobo/pangbobo-actions-complete.glb";

    @Enumerated(EnumType.STRING)
    @Column(name = "loop_mode", nullable = false, length = 20)
    private AnimationLoopMode loopMode = AnimationLoopMode.LOOP;

    @Column(name = "fade_in_ms", nullable = false)
    private int fadeInMs = 180;

    @Column(name = "fade_out_ms", nullable = false)
    private int fadeOutMs = 180;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "metadata_json", columnDefinition = "text")
    private String metadataJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "qa_status", nullable = false, length = 20)
    private AnimationQaStatus qaStatus = AnimationQaStatus.PENDING;

    @Column(name = "qa_notes", length = 2000)
    private String qaNotes;

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
    public String getClipKey() { return clipKey; }
    public void setClipKey(String clipKey) { this.clipKey = clipKey; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ModelAsset getSourceAsset() { return sourceAsset; }
    public void setSourceAsset(ModelAsset sourceAsset) { this.sourceAsset = sourceAsset; }
    public Integer getDurationMs() { return durationMs; }
    public void setDurationMs(Integer durationMs) { this.durationMs = durationMs; }
    public String getModelUrl() { return modelUrl; }
    public void setModelUrl(String modelUrl) { this.modelUrl = modelUrl; }
    public AnimationLoopMode getLoopMode() { return loopMode; }
    public void setLoopMode(AnimationLoopMode loopMode) { this.loopMode = loopMode; }
    public int getFadeInMs() { return fadeInMs; }
    public void setFadeInMs(int fadeInMs) { this.fadeInMs = fadeInMs; }
    public int getFadeOutMs() { return fadeOutMs; }
    public void setFadeOutMs(int fadeOutMs) { this.fadeOutMs = fadeOutMs; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public AnimationQaStatus getQaStatus() { return qaStatus; }
    public void setQaStatus(AnimationQaStatus qaStatus) { this.qaStatus = qaStatus; }
    public String getQaNotes() { return qaNotes; }
    public void setQaNotes(String qaNotes) { this.qaNotes = qaNotes; }
}
