package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxSeries;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BlindboxSeriesRepository extends JpaRepository<BlindboxSeries, Long> {
    @EntityGraph(attributePaths = "variants")
    List<BlindboxSeries> findAllByOrderByDisplayOrderAsc();
    @EntityGraph(attributePaths = "variants")
    Optional<BlindboxSeries> findById(Long id);
    @EntityGraph(attributePaths = "variants")
    Optional<BlindboxSeries> findByCodeAndEnabledTrue(String code);
}
