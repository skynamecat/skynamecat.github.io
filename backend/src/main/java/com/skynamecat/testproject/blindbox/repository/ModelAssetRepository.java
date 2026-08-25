package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.AssetStatus;
import com.skynamecat.testproject.blindbox.entity.ModelAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ModelAssetRepository extends JpaRepository<ModelAsset, Long> {
    Optional<ModelAsset> findByAssetKey(String assetKey);
    Optional<ModelAsset> findByAssetKeyAndStatus(String assetKey, AssetStatus status);
    boolean existsByAssetKey(String assetKey);
    List<ModelAsset> findAllByOrderByCreatedAtDesc();
}
