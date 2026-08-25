package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.entity.AnimationLoopMode;
import com.skynamecat.testproject.blindbox.entity.AssetQuality;
import com.skynamecat.testproject.blindbox.entity.AssetStatus;
import com.skynamecat.testproject.blindbox.entity.AssetKind;
import com.skynamecat.testproject.blindbox.entity.AnimationQaStatus;
import com.skynamecat.testproject.blindbox.entity.BlindboxRarity;
import com.skynamecat.testproject.blindbox.entity.ReleaseAction;
import com.skynamecat.testproject.blindbox.entity.ReleaseStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class BlindboxDtos {
    private BlindboxDtos() {}

    public record VariantView(Long id, String code, String name, String description, BlindboxRarity rarity,
                              int weight, boolean enabled, int displayOrder, String animationClip,
                              Long thumbnailAssetId) {}

    public record SeriesView(Long id, String code, String name, String description, String theme,
                             boolean enabled, int displayOrder, Integer publishedVersion,
                             String modelAssetKey, Instant updatedAt, List<VariantView> variants) {}

    public record SeriesSaveRequest(
            @NotBlank @Pattern(regexp = "[a-z0-9][a-z0-9._-]{1,63}") String code,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description,
            @NotBlank @Size(max = 40) String theme,
            boolean enabled,
            int displayOrder,
            @Size(max = 120) String modelAssetKey
    ) {}

    public record VariantSaveRequest(
            Long id,
            @NotBlank @Pattern(regexp = "[a-z0-9][a-z0-9._-]{1,63}") String code,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description,
            @NotNull BlindboxRarity rarity,
            @Min(0) @Max(1_000_000) int weight,
            boolean enabled,
            int displayOrder,
            @NotBlank @Size(max = 80) String animationClip,
            Long thumbnailAssetId
    ) {}

    public record BatchVariantsRequest(
            @NotEmpty @Size(max = 100) List<@Valid VariantSaveRequest> variants
    ) {}

    public record PublishResult(Long releaseId, int version, Instant publishedAt) {}

    public record ReleaseView(Long id, Long seriesId, String seriesName, int version, ReleaseStatus status,
                              int variantCount, String publishedBy, Instant publishedAt, String note,
                              ReleaseAction action, Long sourceReleaseId) {}

    public record PublishRequest(@Size(max = 500) String note) {}

    public record PublicRelease(String seriesCode, int version, Instant publishedAt, Object content) {}

    public record CurrentManifest(int schemaVersion, Instant generatedAt, List<PublicRelease> series) {}

    public record AssetView(Long id, String fileName, AssetKind kind, String contentType, long size,
                            String url, String checksum, Instant uploadedAt, String assetKey,
                            AssetQuality quality, String skeletonVersion, AssetStatus status, Object metadata,
                            Instant updatedAt) {}

    public record AssetUpdateRequest(
            @NotNull AssetQuality quality,
            @NotBlank @Size(max = 40) String skeletonVersion,
            @NotNull AssetStatus status,
            @Size(max = 20_000) String metadataJson
    ) {}

    public record AnimationView(Long id, String clipKey, String displayName, String description,
                                String sourceAssetKey, Integer durationMs, AnimationLoopMode loopMode,
                                int fadeInMs, int fadeOutMs, boolean enabled, Object metadata) {}

    public record AnimationQaView(Long id, String name, String displayName, String modelUrl,
                                  double duration, AnimationQaStatus qaStatus, String notes, Instant updatedAt) {}

    public record AnimationQaRequest(@NotNull AnimationQaStatus qaStatus, @Size(max = 2000) String notes) {}

    public record AnimationSaveRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9._-]{0,79}") String clipKey,
            @NotBlank @Size(max = 120) String displayName,
            @Size(max = 500) String description,
            @Size(max = 120) String sourceAssetKey,
            @Min(1) Integer durationMs,
            @NotNull AnimationLoopMode loopMode,
            @Min(0) @Max(60_000) int fadeInMs,
            @Min(0) @Max(60_000) int fadeOutMs,
            boolean enabled,
            @Size(max = 20_000) String metadataJson
    ) {}
}
