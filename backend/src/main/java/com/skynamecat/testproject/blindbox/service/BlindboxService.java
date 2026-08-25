package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.BatchVariantsRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.CurrentManifest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.PublicRelease;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.PublishResult;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.ReleaseView;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.SeriesSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.SeriesView;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.VariantSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.VariantView;
import com.skynamecat.testproject.blindbox.entity.AssetStatus;
import com.skynamecat.testproject.blindbox.entity.BlindboxRelease;
import com.skynamecat.testproject.blindbox.entity.BlindboxSeries;
import com.skynamecat.testproject.blindbox.entity.BlindboxVariant;
import com.skynamecat.testproject.blindbox.entity.ReleaseAction;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxReleaseRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxSeriesRepository;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
public class BlindboxService {

    private static final int MAX_VARIANTS = 100;
    private static final long MAX_TOTAL_WEIGHT = 10_000_000L;

    private final BlindboxSeriesRepository seriesRepository;
    private final BlindboxReleaseRepository releaseRepository;
    private final BlindboxAnimationClipRepository animationRepository;
    private final ModelAssetRepository assetRepository;
    private final ObjectMapper objectMapper;

    public BlindboxService(BlindboxSeriesRepository seriesRepository,
                           BlindboxReleaseRepository releaseRepository,
                           BlindboxAnimationClipRepository animationRepository,
                           ModelAssetRepository assetRepository,
                           ObjectMapper objectMapper) {
        this.seriesRepository = seriesRepository;
        this.releaseRepository = releaseRepository;
        this.animationRepository = animationRepository;
        this.assetRepository = assetRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SeriesView> listSeries() {
        return seriesRepository.findAllByOrderByDisplayOrderAsc().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public SeriesView getSeries(Long seriesId) {
        return toView(requireSeries(seriesId));
    }

    @Transactional
    public SeriesView createSeries(SeriesSaveRequest request) {
        String code = normalizeCode(request.code());
        if (seriesRepository.existsByCode(code)) {
            throw new BlindboxValidationException("系列标识已经存在");
        }
        BlindboxSeries series = new BlindboxSeries();
        applySeries(series, request, code);
        return toView(seriesRepository.save(series));
    }

    @Transactional
    public SeriesView updateSeries(Long seriesId, SeriesSaveRequest request) {
        BlindboxSeries series = requireSeries(seriesId);
        String code = normalizeCode(request.code());
        seriesRepository.findByCode(code)
                .filter(existing -> !existing.getId().equals(seriesId))
                .ifPresent(existing -> { throw new BlindboxValidationException("系列标识已经存在"); });
        if (!series.getCode().equals(code) && releaseRepository.existsBySeriesId(seriesId)) {
            throw new BlindboxValidationException("已发布系列不能修改标识");
        }
        applySeries(series, request, code);
        return toView(seriesRepository.save(series));
    }

    @Transactional
    public void deleteSeries(Long seriesId) {
        BlindboxSeries series = requireSeries(seriesId);
        if (releaseRepository.existsBySeriesId(seriesId)) {
            throw new BlindboxValidationException("已发布系列不能删除，可以将其停用");
        }
        seriesRepository.delete(series);
    }

    @Transactional
    public VariantView createVariant(Long seriesId, VariantSaveRequest request) {
        BlindboxSeries series = requireSeries(seriesId);
        if (series.getVariants().size() >= MAX_VARIANTS) {
            throw new BlindboxValidationException("每个系列最多包含 100 个款式");
        }
        ensureUniqueCode(series, null, request.code());
        BlindboxVariant variant = new BlindboxVariant();
        applyVariant(variant, request);
        series.addVariant(variant);
        seriesRepository.save(series);
        return toView(variant);
    }

    @Transactional
    public VariantView updateVariant(Long seriesId, Long variantId, VariantSaveRequest request) {
        BlindboxSeries series = requireSeries(seriesId);
        BlindboxVariant variant = findVariant(series, variantId);
        ensureUniqueCode(series, variantId, request.code());
        applyVariant(variant, request);
        seriesRepository.save(series);
        return toView(variant);
    }

    @Transactional
    public List<VariantView> saveVariants(Long seriesId, BatchVariantsRequest request) {
        BlindboxSeries series = requireSeries(seriesId);
        Set<Long> requestIds = new HashSet<>();
        Set<String> requestCodes = new HashSet<>();
        for (VariantSaveRequest item : request.variants()) {
            String code = normalizeCode(item.code());
            if (!requestCodes.add(code)) {
                throw new BlindboxValidationException("批量款式中存在重复标识：" + code);
            }
            if (item.id() != null && !requestIds.add(item.id())) {
                throw new BlindboxValidationException("批量款式中存在重复 ID");
            }
        }
        long newCount = request.variants().stream().filter(item -> item.id() == null).count();
        if (series.getVariants().size() + newCount > MAX_VARIANTS) {
            throw new BlindboxValidationException("每个系列最多包含 100 个款式");
        }
        for (VariantSaveRequest item : request.variants()) {
            BlindboxVariant variant = item.id() == null ? new BlindboxVariant() : findVariant(series, item.id());
            ensureUniqueCodeConsideringBatch(series, variant.getId(), item.code(), requestIds);
            applyVariant(variant, item);
            if (item.id() == null) series.addVariant(variant);
        }
        validateWeightBounds(series.getVariants());
        seriesRepository.save(series);
        return series.getVariants().stream().map(this::toView).toList();
    }

    @Transactional
    public void deleteVariant(Long seriesId, Long variantId) {
        BlindboxSeries series = requireSeries(seriesId);
        BlindboxVariant variant = findVariant(series, variantId);
        series.removeVariant(variant);
        seriesRepository.save(series);
    }

    @Transactional
    public PublishResult publish(Long seriesId, String username) {
        return publish(seriesId, username, null);
    }

    @Transactional
    public PublishResult publish(Long seriesId, String username, String note) {
        BlindboxSeries series = requireLockedSeries(seriesId);
        validatePublishable(series);
        int nextVersion = nextVersion(seriesId);
        String snapshot = writeSnapshot(toView(series, nextVersion));
        BlindboxRelease saved = releaseRepository.save(new BlindboxRelease(
                series, nextVersion, snapshot, safeUsername(username), ReleaseAction.PUBLISH, null,
                blankToNull(note)));
        series.setCurrentRelease(saved);
        seriesRepository.save(series);
        return new PublishResult(saved.getId(), saved.getVersion(), saved.getPublishedAt());
    }

    @Transactional(readOnly = true)
    public List<ReleaseView> releaseHistory(Long seriesId) {
        if (seriesId == null) {
            return releaseRepository.findAllByOrderByPublishedAtDesc().stream()
                    .map(release -> toView(release, release.getSeries())).toList();
        }
        BlindboxSeries series = requireSeries(seriesId);
        return releaseRepository.findAllBySeriesIdOrderByVersionDesc(seriesId).stream()
                .map(release -> toView(release, series)).toList();
    }

    @Transactional(readOnly = true)
    public ReleaseView getRelease(Long releaseId) {
        BlindboxRelease release = releaseRepository.findById(releaseId)
                .orElseThrow(() -> new EntityNotFoundException("发布版本不存在"));
        return toView(release, release.getSeries());
    }

    @Transactional
    public PublishResult rollback(Long seriesId, Long targetReleaseId, String username) {
        BlindboxSeries series = requireLockedSeries(seriesId);
        BlindboxRelease target = releaseRepository.findByIdAndSeriesId(targetReleaseId, seriesId)
                .orElseThrow(() -> new EntityNotFoundException("回滚目标版本不存在"));
        // Parsing here prevents propagating a damaged historical snapshot as the current release.
        readSnapshot(target);
        int nextVersion = nextVersion(seriesId);
        BlindboxRelease saved = releaseRepository.save(new BlindboxRelease(
                series, nextVersion, target.getContentJson(), safeUsername(username), ReleaseAction.ROLLBACK, target));
        series.setCurrentRelease(saved);
        seriesRepository.save(series);
        return new PublishResult(saved.getId(), saved.getVersion(), saved.getPublishedAt());
    }

    @Transactional
    public PublishResult rollback(Long targetReleaseId, String username) {
        BlindboxRelease target = releaseRepository.findById(targetReleaseId)
                .orElseThrow(() -> new EntityNotFoundException("回滚目标版本不存在"));
        return rollback(target.getSeries().getId(), targetReleaseId, username);
    }

    @Transactional(readOnly = true)
    public PublicRelease current(String seriesCode) {
        BlindboxSeries series = seriesRepository.findByCodeAndEnabledTrue(normalizeCode(seriesCode))
                .orElseThrow(() -> new EntityNotFoundException("盲盒系列不存在"));
        return toPublicRelease(series, currentRelease(series));
    }

    @Transactional(readOnly = true)
    public CurrentManifest currentManifest() {
        List<PublicRelease> releases = seriesRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(BlindboxSeries::isEnabled)
                .map(series -> currentReleaseOptional(series).map(release -> toPublicRelease(series, release)).orElse(null))
                .filter(Objects::nonNull)
                .toList();
        Instant generatedAt = releases.stream().map(PublicRelease::publishedAt).max(Instant::compareTo).orElse(Instant.EPOCH);
        return new CurrentManifest(1, generatedAt, releases);
    }

    private void applySeries(BlindboxSeries series, SeriesSaveRequest request, String code) {
        series.setCode(code);
        series.setName(request.name().trim());
        series.setDescription(blankToNull(request.description()));
        series.setTheme(request.theme().trim().toUpperCase(Locale.ROOT));
        series.setEnabled(request.enabled());
        series.setDisplayOrder(request.displayOrder());
        String assetKey = blankToNull(request.modelAssetKey());
        if (assetKey != null && !assetRepository.existsByAssetKey(assetKey.toLowerCase(Locale.ROOT))) {
            throw new BlindboxValidationException("系列引用的模型素材不存在");
        }
        series.setModelAssetKey(assetKey == null ? null : assetKey.toLowerCase(Locale.ROOT));
    }

    private void applyVariant(BlindboxVariant variant, VariantSaveRequest request) {
        if (request.weight() < 0 || request.weight() > 1_000_000) {
            throw new BlindboxValidationException("款式权重必须在 0–1000000 之间");
        }
        String clipKey = request.animationClip().trim();
        if (!animationRepository.existsByClipKey(clipKey)) {
            throw new BlindboxValidationException("动画片段不存在：" + clipKey);
        }
        variant.setCode(normalizeCode(request.code()));
        variant.setName(request.name().trim());
        variant.setDescription(blankToNull(request.description()));
        variant.setRarity(request.rarity());
        variant.setWeight(request.weight());
        variant.setEnabled(request.enabled());
        variant.setDisplayOrder(request.displayOrder());
        variant.setAnimationClip(clipKey);
        variant.setThumbnailAsset(resolveThumbnail(request.thumbnailAssetId()));
    }

    private void validatePublishable(BlindboxSeries series) {
        List<BlindboxVariant> enabled = series.getVariants().stream().filter(BlindboxVariant::isEnabled).toList();
        if (enabled.isEmpty() || enabled.stream().noneMatch(variant -> variant.getWeight() > 0)) {
            throw new BlindboxValidationException("至少需要一个权重大于零的启用款式");
        }
        validateWeightBounds(enabled);
        for (BlindboxVariant variant : enabled) {
            var clip = animationRepository.findByClipKey(variant.getAnimationClip())
                    .orElseThrow(() -> new BlindboxValidationException("动画片段不存在：" + variant.getAnimationClip()));
            if (!clip.isEnabled()) {
                throw new BlindboxValidationException("启用款式引用了停用动画：" + variant.getAnimationClip());
            }
        }
        if (series.getModelAssetKey() != null
                && assetRepository.findByAssetKeyAndStatus(series.getModelAssetKey(), AssetStatus.READY).isEmpty()) {
            throw new BlindboxValidationException("系列模型素材尚未就绪");
        }
    }

    private void validateWeightBounds(List<BlindboxVariant> variants) {
        long total = 0;
        for (BlindboxVariant variant : variants) {
            if (variant.getWeight() < 0 || variant.getWeight() > 1_000_000) {
                throw new BlindboxValidationException("款式权重必须在 0–1000000 之间");
            }
            if (variant.isEnabled()) total += variant.getWeight();
        }
        if (total > MAX_TOTAL_WEIGHT) {
            throw new BlindboxValidationException("启用款式总权重不能超过 10000000");
        }
    }

    private void ensureUniqueCode(BlindboxSeries series, Long excludedId, String requestedCode) {
        String code = normalizeCode(requestedCode);
        boolean duplicate = series.getVariants().stream()
                .anyMatch(item -> !Objects.equals(item.getId(), excludedId) && item.getCode().equals(code));
        if (duplicate) throw new BlindboxValidationException("款式标识已经存在：" + code);
    }

    private void ensureUniqueCodeConsideringBatch(BlindboxSeries series, Long excludedId, String requestedCode,
                                                   Set<Long> batchIds) {
        String code = normalizeCode(requestedCode);
        boolean duplicateUnchanged = series.getVariants().stream()
                .anyMatch(item -> !Objects.equals(item.getId(), excludedId)
                        && !batchIds.contains(item.getId())
                        && item.getCode().equals(code));
        if (duplicateUnchanged) throw new BlindboxValidationException("款式标识已经存在：" + code);
    }

    private BlindboxVariant findVariant(BlindboxSeries series, Long variantId) {
        return series.getVariants().stream().filter(item -> item.getId().equals(variantId)).findFirst()
                .orElseThrow(() -> new EntityNotFoundException("盲盒款式不存在"));
    }

    private BlindboxSeries requireSeries(Long id) {
        return seriesRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("盲盒系列不存在"));
    }

    private BlindboxSeries requireLockedSeries(Long id) {
        return seriesRepository.findLockedById(id).orElseThrow(() -> new EntityNotFoundException("盲盒系列不存在"));
    }

    private int nextVersion(Long seriesId) {
        return releaseRepository.findFirstBySeriesIdOrderByVersionDesc(seriesId)
                .map(value -> Math.addExact(value.getVersion(), 1)).orElse(1);
    }

    private BlindboxRelease currentRelease(BlindboxSeries series) {
        return currentReleaseOptional(series).orElseThrow(() -> new EntityNotFoundException("该系列尚未发布"));
    }

    private java.util.Optional<BlindboxRelease> currentReleaseOptional(BlindboxSeries series) {
        if (series.getCurrentRelease() != null) return java.util.Optional.of(series.getCurrentRelease());
        return releaseRepository.findFirstBySeriesIdOrderByVersionDesc(series.getId());
    }

    private String writeSnapshot(SeriesView view) {
        try {
            return objectMapper.writeValueAsString(view);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法生成发布快照", exception);
        }
    }

    private Object readSnapshot(BlindboxRelease release) {
        try {
            return objectMapper.readTree(release.getContentJson());
        } catch (JacksonException exception) {
            throw new IllegalStateException("发布快照已损坏", exception);
        }
    }

    private PublicRelease toPublicRelease(BlindboxSeries series, BlindboxRelease release) {
        return new PublicRelease(series.getCode(), release.getVersion(), release.getPublishedAt(), readSnapshot(release));
    }

    private SeriesView toView(BlindboxSeries series) {
        Integer version = currentReleaseOptional(series).map(BlindboxRelease::getVersion).orElse(null);
        return toView(series, version);
    }

    private SeriesView toView(BlindboxSeries series, Integer publishedVersion) {
        return new SeriesView(series.getId(), series.getCode(), series.getName(), series.getDescription(),
                series.getTheme(), series.isEnabled(), series.getDisplayOrder(), publishedVersion,
                series.getModelAssetKey(), series.getUpdatedAt(),
                series.getVariants().stream().map(this::toView).toList());
    }

    private VariantView toView(BlindboxVariant variant) {
        return new VariantView(variant.getId(), variant.getCode(), variant.getName(), variant.getDescription(),
                variant.getRarity(), variant.getWeight(), variant.isEnabled(), variant.getDisplayOrder(),
                variant.getAnimationClip(), variant.getThumbnailAsset() == null ? null : variant.getThumbnailAsset().getId());
    }

    private ReleaseView toView(BlindboxRelease release, BlindboxSeries series) {
        boolean current = series.getCurrentRelease() != null
                && Objects.equals(series.getCurrentRelease().getId(), release.getId());
        com.skynamecat.testproject.blindbox.entity.ReleaseStatus status = current
                ? com.skynamecat.testproject.blindbox.entity.ReleaseStatus.PUBLISHED
                : release.getReleaseAction() == ReleaseAction.ROLLBACK
                    ? com.skynamecat.testproject.blindbox.entity.ReleaseStatus.ROLLED_BACK
                    : com.skynamecat.testproject.blindbox.entity.ReleaseStatus.SUPERSEDED;
        return new ReleaseView(release.getId(), series.getId(), series.getName(), release.getVersion(), status,
                variantCount(release), release.getPublishedBy(), release.getPublishedAt(), release.getNote(),
                release.getReleaseAction(), release.getSourceRelease() == null ? null : release.getSourceRelease().getId());
    }

    private int variantCount(BlindboxRelease release) {
        try {
            var variants = objectMapper.readTree(release.getContentJson()).get("variants");
            return variants == null || !variants.isArray() ? 0 : variants.size();
        } catch (JacksonException exception) {
            return 0;
        }
    }

    private com.skynamecat.testproject.blindbox.entity.ModelAsset resolveThumbnail(Long assetId) {
        if (assetId == null) return null;
        var asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new BlindboxValidationException("缩略图素材不存在"));
        if (asset.getStatus() == AssetStatus.ARCHIVED) {
            throw new BlindboxValidationException("缩略图素材已归档");
        }
        if (asset.getKind() != com.skynamecat.testproject.blindbox.entity.AssetKind.THUMBNAIL
                && asset.getKind() != com.skynamecat.testproject.blindbox.entity.AssetKind.TEXTURE) {
            throw new BlindboxValidationException("款式缩略图必须引用图片素材");
        }
        return asset;
    }

    private String normalizeCode(String code) {
        if (code == null) throw new BlindboxValidationException("标识不能为空");
        String normalized = code.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9][a-z0-9._-]{1,63}")) {
            throw new BlindboxValidationException("标识格式无效");
        }
        return normalized;
    }

    private String safeUsername(String username) {
        if (username == null || username.isBlank()) return "system";
        return username.length() > 120 ? username.substring(0, 120) : username;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
