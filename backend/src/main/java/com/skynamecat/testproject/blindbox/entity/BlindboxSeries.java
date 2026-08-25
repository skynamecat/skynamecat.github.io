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
}
