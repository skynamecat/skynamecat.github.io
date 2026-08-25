package com.skynamecat.testproject.blindbox.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blindbox_variant")
public class BlindboxVariant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "series_id", nullable = false)
    private BlindboxSeries series;
    @Column(nullable = false, length = 64)
    private String code;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 500)
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BlindboxRarity rarity;
    @Column(nullable = false)
    private int weight;
    @Column(nullable = false)
    private boolean enabled = true;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "animation_clip", nullable = false, length = 80)
    private String animationClip;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thumbnail_asset_id")
    private ModelAsset thumbnailAsset;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist void prePersist() { var now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void preUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BlindboxRarity getRarity() { return rarity; }
    public int getWeight() { return weight; }
    public boolean isEnabled() { return enabled; }
    public int getDisplayOrder() { return displayOrder; }
    public String getAnimationClip() { return animationClip; }
    public BlindboxSeries getSeries() { return series; }
    public void setSeries(BlindboxSeries series) { this.series = series; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setRarity(BlindboxRarity rarity) { this.rarity = rarity; }
    public void setWeight(int weight) { this.weight = weight; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public void setAnimationClip(String animationClip) { this.animationClip = animationClip; }
    public ModelAsset getThumbnailAsset() { return thumbnailAsset; }
    public void setThumbnailAsset(ModelAsset thumbnailAsset) { this.thumbnailAsset = thumbnailAsset; }
}
