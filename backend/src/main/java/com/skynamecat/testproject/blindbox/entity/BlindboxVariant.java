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
}
