package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxAnimationClip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlindboxAnimationClipRepository extends JpaRepository<BlindboxAnimationClip, Long> {
    Optional<BlindboxAnimationClip> findByClipKey(String clipKey);
    boolean existsByClipKey(String clipKey);
    List<BlindboxAnimationClip> findAllByOrderByDisplayNameAsc();
    boolean existsBySourceAssetId(Long sourceAssetId);
}
