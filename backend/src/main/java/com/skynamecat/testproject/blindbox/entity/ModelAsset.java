package com.skynamecat.testproject.blindbox.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "model_asset")
public class ModelAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_key", nullable = false, unique = true, length = 120)
    private String assetKey;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "content_hash", nullable = false, length = 128)
    private String contentHash;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetQuality quality;

    @Column(name = "skeleton_version", nullable = false, length = 40)
    private String skeletonVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_kind", nullable = false, length = 20)
    private AssetKind kind = AssetKind.MODEL;

    @Column(name = "metadata_json", columnDefinition = "text")
    private String metadataJson;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 120)
    private String contentType;

    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ModelAsset() {
    }

    public ModelAsset(
            String assetKey,
            String fileUrl,
            String contentHash,
            long sizeBytes,
            AssetQuality quality,
            String skeletonVersion,
            AssetStatus status,
            AssetKind kind,
            String metadataJson,
            String originalFilename,
            String contentType,
            String storagePath
    ) {
        this.assetKey = assetKey;
        this.fileUrl = fileUrl;
        this.contentHash = contentHash;
        this.sizeBytes = sizeBytes;
        this.quality = quality;
        this.skeletonVersion = skeletonVersion;
        this.status = status;
        this.kind = kind;
        this.metadataJson = metadataJson;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.storagePath = storagePath;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getAssetKey() { return assetKey; }
    public String getFileUrl() { return fileUrl; }
    public String getContentHash() { return contentHash; }
    public long getSizeBytes() { return sizeBytes; }
    public AssetQuality getQuality() { return quality; }
    public String getSkeletonVersion() { return skeletonVersion; }
    public AssetStatus getStatus() { return status; }
    public AssetKind getKind() { return kind; }
    public String getMetadataJson() { return metadataJson; }
    public String getOriginalFilename() { return originalFilename; }
    public String getContentType() { return contentType; }
    public String getStoragePath() { return storagePath; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void updateMetadata(AssetQuality quality, String skeletonVersion, AssetStatus status, String metadataJson) {
        this.quality = quality;
        this.skeletonVersion = skeletonVersion;
        this.status = status;
        this.metadataJson = metadataJson;
    }

    public void archive() {
        this.status = AssetStatus.ARCHIVED;
    }
}
