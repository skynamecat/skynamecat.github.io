package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlindboxVariantRepository extends JpaRepository<BlindboxVariant, Long> {
    Optional<BlindboxVariant> findByIdAndSeriesId(Long id, Long seriesId);
    boolean existsByAnimationClip(String animationClip);
    boolean existsByThumbnailAssetId(Long thumbnailAssetId);
}
