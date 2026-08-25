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
    @Enumerated(EnumType.STRING)
    @Column(name = "release_action", nullable = false, length = 20)
    private ReleaseAction releaseAction = ReleaseAction.PUBLISH;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_release_id")
    private BlindboxRelease sourceRelease;
    @Column(length = 500)
    private String note;

    @PrePersist
    void prePersist() { publishedAt = Instant.now(); }

    protected BlindboxRelease() {}
    public BlindboxRelease(BlindboxSeries series, int version, String contentJson, String publishedBy) {
        this(series, version, contentJson, publishedBy, ReleaseAction.PUBLISH, null);
    }
    public BlindboxRelease(BlindboxSeries series, int version, String contentJson, String publishedBy,
                           ReleaseAction releaseAction, BlindboxRelease sourceRelease) {
        this(series, version, contentJson, publishedBy, releaseAction, sourceRelease, null);
    }
    public BlindboxRelease(BlindboxSeries series, int version, String contentJson, String publishedBy,
                           ReleaseAction releaseAction, BlindboxRelease sourceRelease, String note) {
        this.series = series;
        this.version = version;
        this.contentJson = contentJson;
        this.publishedBy = publishedBy;
        this.releaseAction = releaseAction;
        this.sourceRelease = sourceRelease;
        this.note = note;
    }
    public Long getId() { return id; }
    public BlindboxSeries getSeries() { return series; }
    public int getVersion() { return version; }
    public String getContentJson() { return contentJson; }
    public Instant getPublishedAt() { return publishedAt; }
    public String getPublishedBy() { return publishedBy; }
    public ReleaseAction getReleaseAction() { return releaseAction; }
    public BlindboxRelease getSourceRelease() { return sourceRelease; }
    public String getNote() { return note; }
}
