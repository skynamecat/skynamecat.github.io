package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.BatchVariantsRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.SeriesSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.VariantSaveRequest;
import com.skynamecat.testproject.blindbox.entity.BlindboxAnimationClip;
import com.skynamecat.testproject.blindbox.entity.BlindboxRarity;
import com.skynamecat.testproject.blindbox.entity.BlindboxRelease;
import com.skynamecat.testproject.blindbox.entity.BlindboxSeries;
import com.skynamecat.testproject.blindbox.entity.BlindboxVariant;
import com.skynamecat.testproject.blindbox.entity.ReleaseAction;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxReleaseRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxSeriesRepository;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BlindboxServiceTest {

    private final BlindboxSeriesRepository seriesRepository = mock(BlindboxSeriesRepository.class);
    private final BlindboxReleaseRepository releaseRepository = mock(BlindboxReleaseRepository.class);
    private final BlindboxAnimationClipRepository animationRepository = mock(BlindboxAnimationClipRepository.class);
    private final ModelAssetRepository assetRepository = mock(ModelAssetRepository.class);
    private final BlindboxService service = new BlindboxService(seriesRepository, releaseRepository,
            animationRepository, assetRepository, JsonMapper.builder().build());

    @BeforeEach
    void saveAnswersReturnEntitiesWithIds() {
        when(seriesRepository.save(any())).thenAnswer(invocation -> {
            BlindboxSeries series = invocation.getArgument(0);
            if (series.getId() == null) ReflectionTestUtils.setField(series, "id", 10L);
            return series;
        });
        when(releaseRepository.save(any())).thenAnswer(invocation -> {
            BlindboxRelease release = invocation.getArgument(0);
            ReflectionTestUtils.setField(release, "id", 99L);
            ReflectionTestUtils.setField(release, "publishedAt", Instant.parse("2026-08-25T00:00:00Z"));
            return release;
        });
    }

    @Test
    void createsAndUpdatesSeriesWithStableCodeRules() {
        var request = new SeriesSaveRequest("daily-2", "新日常", "说明", "daily", true, 3, null);
        when(seriesRepository.existsByCode("daily-2")).thenReturn(false);
        when(releaseRepository.findFirstBySeriesIdOrderByVersionDesc(10L)).thenReturn(Optional.empty());

        var created = service.createSeries(request);

        assertThat(created.id()).isEqualTo(10L);
        assertThat(created.code()).isEqualTo("daily-2");
        assertThat(created.theme()).isEqualTo("DAILY");
        assertThat(created.variants()).isEmpty();
    }

    @Test
    void batchSavesNewVariantsAndRejectsDuplicateCodes() {
        BlindboxSeries series = series(10L, "daily");
        when(seriesRepository.findById(10L)).thenReturn(Optional.of(series));
        when(animationRepository.existsByClipKey("Walk")).thenReturn(true);

        var request = new BatchVariantsRequest(List.of(
                variant(null, "walk", 10, "Walk"),
                variant(null, "walk", 20, "Walk")
        ));

        assertThatThrownBy(() -> service.saveVariants(10L, request))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("重复标识");
    }

    @Test
    void publishesValidatedSnapshotAndMarksCurrentRelease() {
        BlindboxSeries series = series(10L, "daily");
        BlindboxVariant variant = new BlindboxVariant();
        variant.setCode("walk");
        variant.setName("散步");
        variant.setDescription("走走");
        variant.setRarity(BlindboxRarity.COMMON);
        variant.setWeight(10);
        variant.setEnabled(true);
        variant.setDisplayOrder(1);
        variant.setAnimationClip("Walk");
        series.addVariant(variant);
        BlindboxAnimationClip clip = new BlindboxAnimationClip();
        clip.setClipKey("Walk");
        clip.setDisplayName("Walk");
        clip.setEnabled(true);
        when(seriesRepository.findLockedById(10L)).thenReturn(Optional.of(series));
        when(animationRepository.findByClipKey("Walk")).thenReturn(Optional.of(clip));
        when(releaseRepository.findFirstBySeriesIdOrderByVersionDesc(10L)).thenReturn(Optional.empty());

        var result = service.publish(10L, "admin");

        assertThat(result.releaseId()).isEqualTo(99L);
        assertThat(result.version()).isEqualTo(1);
        assertThat(series.getCurrentRelease()).isNotNull();
        assertThat(series.getCurrentRelease().getContentJson()).contains("\"publishedVersion\":1");
        verify(seriesRepository).save(series);
    }

    @Test
    void rejectsPublishWhenAllEnabledWeightsAreZero() {
        BlindboxSeries series = series(10L, "daily");
        BlindboxVariant variant = new BlindboxVariant();
        variant.setCode("idle");
        variant.setName("发呆");
        variant.setRarity(BlindboxRarity.COMMON);
        variant.setWeight(0);
        variant.setEnabled(true);
        variant.setAnimationClip("Idle");
        series.addVariant(variant);
        when(seriesRepository.findLockedById(10L)).thenReturn(Optional.of(series));

        assertThatThrownBy(() -> service.publish(10L, "admin"))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("权重大于零");
    }

    @Test
    void rollbackCreatesNewAuditedVersionWithoutMutatingTarget() {
        BlindboxSeries series = series(10L, "daily");
        BlindboxRelease target = new BlindboxRelease(series, 1, "{\"name\":\"old\"}", "admin");
        ReflectionTestUtils.setField(target, "id", 41L);
        BlindboxRelease latest = new BlindboxRelease(series, 2, "{\"name\":\"new\"}", "admin");
        ReflectionTestUtils.setField(latest, "id", 42L);
        when(seriesRepository.findLockedById(10L)).thenReturn(Optional.of(series));
        when(releaseRepository.findByIdAndSeriesId(41L, 10L)).thenReturn(Optional.of(target));
        when(releaseRepository.findFirstBySeriesIdOrderByVersionDesc(10L)).thenReturn(Optional.of(latest));

        var result = service.rollback(10L, 41L, "operator");

        assertThat(result.version()).isEqualTo(3);
        assertThat(series.getCurrentRelease().getReleaseAction()).isEqualTo(ReleaseAction.ROLLBACK);
        assertThat(series.getCurrentRelease().getSourceRelease()).isSameAs(target);
        assertThat(series.getCurrentRelease().getContentJson()).isEqualTo(target.getContentJson());
    }

    @Test
    void currentManifestOnlyIncludesEnabledPublishedSeries() {
        BlindboxSeries published = series(10L, "daily");
        BlindboxRelease release = new BlindboxRelease(published, 1, "{\"code\":\"daily\"}", "admin");
        ReflectionTestUtils.setField(release, "publishedAt", Instant.parse("2026-08-24T10:00:00Z"));
        published.setCurrentRelease(release);
        BlindboxSeries draft = series(11L, "draft");
        when(seriesRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(published, draft));

        var manifest = service.currentManifest();

        assertThat(manifest.schemaVersion()).isEqualTo(1);
        assertThat(manifest.generatedAt()).isEqualTo(Instant.parse("2026-08-24T10:00:00Z"));
        assertThat(manifest.series()).extracting(item -> item.seriesCode()).containsExactly("daily");
    }

    private BlindboxSeries series(Long id, String code) {
        BlindboxSeries series = new BlindboxSeries();
        ReflectionTestUtils.setField(series, "id", id);
        series.setCode(code);
        series.setName(code);
        series.setTheme("DAILY");
        series.setEnabled(true);
        return series;
    }

    private VariantSaveRequest variant(Long id, String code, int weight, String clip) {
        return new VariantSaveRequest(id, code, code, null, BlindboxRarity.COMMON,
                weight, true, 1, clip, null);
    }
}
