package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxRelease;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlindboxReleaseRepository extends JpaRepository<BlindboxRelease, Long> {
    Optional<BlindboxRelease> findFirstBySeriesIdOrderByVersionDesc(Long seriesId);
}
