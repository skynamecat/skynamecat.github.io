package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.entity.BlindboxRarity;
import java.time.Instant;
import java.util.List;

public final class BlindboxDtos {
    private BlindboxDtos() {}

    public record VariantView(Long id, String code, String name, String description, BlindboxRarity rarity,
                              int weight, boolean enabled, int displayOrder, String animationClip) {}
    public record SeriesView(Long id, String code, String name, String description, String theme,
                             boolean enabled, int displayOrder, Integer publishedVersion,
                             List<VariantView> variants) {}
    public record PublishResult(Long releaseId, int version, Instant publishedAt) {}
    public record PublicRelease(String seriesCode, int version, Instant publishedAt, Object content) {}
}
