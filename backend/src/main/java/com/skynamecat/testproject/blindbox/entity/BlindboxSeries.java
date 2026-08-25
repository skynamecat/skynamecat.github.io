package com.skynamecat.testproject.blindbox.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blindbox_series")
public class BlindboxSeries {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 500)
    private String description;
    @Column(nullable = false, length = 40)
    private String theme = "DAILY";
    @Column(nullable = false)
    private boolean enabled = true;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "model_asset_key", length = 120)
    private String modelAssetKey;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_release_id")
    private BlindboxRelease currentRelease;
    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<BlindboxVariant> variants = new ArrayList<>();
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
    public String getTheme() { return theme; }
    public boolean isEnabled() { return enabled; }
    public int getDisplayOrder() { return displayOrder; }
    public List<BlindboxVariant> getVariants() { return variants; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setTheme(String theme) { this.theme = theme; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public String getModelAssetKey() { return modelAssetKey; }
    public void setModelAssetKey(String modelAssetKey) { this.modelAssetKey = modelAssetKey; }
    public BlindboxRelease getCurrentRelease() { return currentRelease; }
    public void setCurrentRelease(BlindboxRelease currentRelease) { this.currentRelease = currentRelease; }

    public void addVariant(BlindboxVariant variant) {
        variants.add(variant);
        variant.setSeries(this);
    }

    public void removeVariant(BlindboxVariant variant) {
        variants.remove(variant);
        variant.setSeries(null);
    }
}
