package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxRelease;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BlindboxReleaseRepository extends JpaRepository<BlindboxRelease, Long> {
    Optional<BlindboxRelease> findFirstBySeriesIdOrderByVersionDesc(Long seriesId);
    List<BlindboxRelease> findAllBySeriesIdOrderByVersionDesc(Long seriesId);
    List<BlindboxRelease> findAllByOrderByPublishedAtDesc();
    Optional<BlindboxRelease> findByIdAndSeriesId(Long id, Long seriesId);
    boolean existsBySeriesId(Long seriesId);
}
