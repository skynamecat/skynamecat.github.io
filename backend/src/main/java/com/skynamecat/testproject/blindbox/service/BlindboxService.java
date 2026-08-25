package com.skynamecat.testproject.blindbox.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.*;
import com.skynamecat.testproject.blindbox.entity.*;
import com.skynamecat.testproject.blindbox.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BlindboxService {
    private final BlindboxSeriesRepository seriesRepository;
    private final BlindboxReleaseRepository releaseRepository;
    private final ObjectMapper objectMapper;

    public BlindboxService(BlindboxSeriesRepository seriesRepository, BlindboxReleaseRepository releaseRepository,
                           ObjectMapper objectMapper) {
        this.seriesRepository = seriesRepository;
        this.releaseRepository = releaseRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SeriesView> listSeries() {
        return seriesRepository.findAllByOrderByDisplayOrderAsc().stream().map(this::toView).toList();
    }

    @Transactional
    public PublishResult publish(Long seriesId, String username) {
        var series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new EntityNotFoundException("盲盒系列不存在"));
        if (series.getVariants().stream().noneMatch(v -> v.isEnabled() && v.getWeight() > 0)) {
            throw new IllegalStateException("至少需要一个权重大于零的启用款式");
        }
        int nextVersion = releaseRepository.findFirstBySeriesIdOrderByVersionDesc(seriesId)
                .map(value -> value.getVersion() + 1).orElse(1);
        try {
            String snapshot = objectMapper.writeValueAsString(toView(series));
            var saved = releaseRepository.save(new BlindboxRelease(series, nextVersion, snapshot, username));
            return new PublishResult(saved.getId(), saved.getVersion(), saved.getPublishedAt());
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法生成发布快照", exception);
        }
    }

    @Transactional(readOnly = true)
    public PublicRelease current(String seriesCode) {
        var series = seriesRepository.findByCodeAndEnabledTrue(seriesCode)
                .orElseThrow(() -> new EntityNotFoundException("盲盒系列不存在"));
        var release = releaseRepository.findFirstBySeriesIdOrderByVersionDesc(series.getId())
                .orElseThrow(() -> new EntityNotFoundException("该系列尚未发布"));
        try {
            return new PublicRelease(seriesCode, release.getVersion(), release.getPublishedAt(),
                    objectMapper.readTree(release.getContentJson()));
        } catch (JacksonException exception) {
            throw new IllegalStateException("发布快照已损坏", exception);
        }
    }

    private SeriesView toView(BlindboxSeries series) {
        Integer version = releaseRepository.findFirstBySeriesIdOrderByVersionDesc(series.getId())
                .map(BlindboxRelease::getVersion).orElse(null);
        return new SeriesView(series.getId(), series.getCode(), series.getName(), series.getDescription(),
                series.getTheme(), series.isEnabled(), series.getDisplayOrder(), version,
                series.getVariants().stream().map(this::toView).toList());
    }

    private VariantView toView(BlindboxVariant variant) {
        return new VariantView(variant.getId(), variant.getCode(), variant.getName(), variant.getDescription(),
                variant.getRarity(), variant.getWeight(), variant.isEnabled(), variant.getDisplayOrder(),
                variant.getAnimationClip());
    }
}
