package com.skynamecat.testproject.blindbox.repository;

import com.skynamecat.testproject.blindbox.entity.BlindboxSeries;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface BlindboxSeriesRepository extends JpaRepository<BlindboxSeries, Long> {
    @EntityGraph(attributePaths = "variants")
    List<BlindboxSeries> findAllByOrderByDisplayOrderAsc();
    @EntityGraph(attributePaths = "variants")
    Optional<BlindboxSeries> findById(Long id);
    @EntityGraph(attributePaths = "variants")
    Optional<BlindboxSeries> findByCodeAndEnabledTrue(String code);
    Optional<BlindboxSeries> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByModelAssetKey(String modelAssetKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "variants")
    @Query("select s from BlindboxSeries s where s.id = :id")
    Optional<BlindboxSeries> findLockedById(@Param("id") Long id);
}
