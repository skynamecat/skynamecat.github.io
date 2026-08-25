package com.skynamecat.testproject.blindbox.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blindbox_release")
public class BlindboxRelease {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "series_id", nullable = false)
    private BlindboxSeries series;
    @Column(nullable = false)
    private int version;
    @Column(name = "content_json", nullable = false, columnDefinition = "text")
    private String contentJson;
    @Column(name = "published_by", nullable = false, length = 120)
    private String publishedBy;
    @Column(name = "published_at", nullable = false, updatable = false)
    private Instant publishedAt;

    @PrePersist
    void prePersist() { publishedAt = Instant.now(); }

    protected BlindboxRelease() {}
    public BlindboxRelease(BlindboxSeries series, int version, String contentJson, String publishedBy) {
        this.series = series;
        this.version = version;
        this.contentJson = contentJson;
        this.publishedBy = publishedBy;
    }
    public Long getId() { return id; }
    public BlindboxSeries getSeries() { return series; }
    public int getVersion() { return version; }
    public String getContentJson() { return contentJson; }
    public Instant getPublishedAt() { return publishedAt; }
}
