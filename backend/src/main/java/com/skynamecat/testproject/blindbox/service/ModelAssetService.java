package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AssetUpdateRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AssetView;
import com.skynamecat.testproject.blindbox.entity.AssetQuality;
import com.skynamecat.testproject.blindbox.entity.AssetStatus;
import com.skynamecat.testproject.blindbox.entity.AssetKind;
import com.skynamecat.testproject.blindbox.entity.ModelAsset;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxSeriesRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxVariantRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.storage.BlindboxAssetStorage;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.PathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ModelAssetService {

    private final ModelAssetRepository repository;
    private final BlindboxAssetStorage storage;
    private final ObjectMapper objectMapper;
    private final BlindboxSeriesRepository seriesRepository;
    private final BlindboxVariantRepository variantRepository;
    private final BlindboxAnimationClipRepository animationRepository;

    public ModelAssetService(ModelAssetRepository repository, BlindboxAssetStorage storage, ObjectMapper objectMapper,
                             BlindboxSeriesRepository seriesRepository, BlindboxVariantRepository variantRepository,
                             BlindboxAnimationClipRepository animationRepository) {
        this.repository = repository;
        this.storage = storage;
        this.objectMapper = objectMapper;
        this.seriesRepository = seriesRepository;
        this.variantRepository = variantRepository;
        this.animationRepository = animationRepository;
    }

    @Transactional(readOnly = true)
    public List<AssetView> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(asset -> asset.getStatus() != AssetStatus.ARCHIVED)
                .map(this::toView).toList();
    }

    @Transactional
    public AssetView upload(AssetKind kind, MultipartFile file) {
        String assetKey = kind.name().toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID().toString().replace("-", "");
        var stored = storage.store(assetKey, kind, file);
        ModelAsset asset = new ModelAsset(
                assetKey, stored.fileUrl(), stored.contentHash(), stored.sizeBytes(), AssetQuality.BALANCED,
                "n/a", AssetStatus.READY, kind, null, stored.originalFilename(), stored.contentType(),
                stored.storagePath());
        return toView(repository.save(asset));
    }

    @Transactional
    public AssetView upload(String requestedKey, AssetQuality quality, String skeletonVersion,
                            String metadataJson, MultipartFile file) {
        String assetKey = normalizeAssetKey(requestedKey);
        if (repository.existsByAssetKey(assetKey)) {
            throw new BlindboxValidationException("素材标识已经存在");
        }
        validateMetadata(metadataJson);
        if (skeletonVersion == null || skeletonVersion.isBlank() || skeletonVersion.length() > 40) {
            throw new BlindboxValidationException("骨骼版本不能为空且不能超过 40 个字符");
        }
        var stored = storage.store(assetKey, AssetKind.MODEL, file);
        ModelAsset asset = new ModelAsset(
                assetKey,
                stored.fileUrl(),
                stored.contentHash(),
                stored.sizeBytes(),
                quality,
                skeletonVersion.trim(),
                AssetStatus.UPLOADED,
                AssetKind.MODEL,
                blankToNull(metadataJson),
                stored.originalFilename(),
                stored.contentType(),
                stored.storagePath()
        );
        return toView(repository.save(asset));
    }

    @Transactional
    public AssetView update(Long id, AssetUpdateRequest request) {
        ModelAsset asset = requireAsset(id);
        validateMetadata(request.metadataJson());
        if (asset.getStatus() == AssetStatus.ARCHIVED && request.status() != AssetStatus.ARCHIVED) {
            throw new BlindboxValidationException("已归档素材不能重新启用");
        }
        asset.updateMetadata(request.quality(), request.skeletonVersion().trim(), request.status(),
                blankToNull(request.metadataJson()));
        return toView(repository.save(asset));
    }

    @Transactional
    public AssetView archive(Long id) {
        ModelAsset asset = requireAsset(id);
        if (seriesRepository.existsByModelAssetKey(asset.getAssetKey())
                || variantRepository.existsByThumbnailAssetId(id)
                || animationRepository.existsBySourceAssetId(id)) {
            throw new BlindboxValidationException("素材正在被系列、款式或动画引用，不能删除");
        }
        asset.archive();
        return toView(repository.save(asset));
    }

    @Transactional(readOnly = true)
    public AssetDownload downloadReady(String assetKey) {
        ModelAsset asset = repository.findByAssetKeyAndStatus(normalizeAssetKey(assetKey), AssetStatus.READY)
                .orElseThrow(() -> new EntityNotFoundException("素材不存在或尚未就绪"));
        Path path = storage.resolveStoredPath(asset.getStoragePath());
        if (!Files.isRegularFile(path)) {
            throw new EntityNotFoundException("素材文件不存在");
        }
        return new AssetDownload(new PathResource(path), asset.getContentType(), asset.getContentHash(), asset.getSizeBytes());
    }

    private ModelAsset requireAsset(Long id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("素材不存在"));
    }

    private String normalizeAssetKey(String value) {
        if (value == null) {
            throw new BlindboxValidationException("素材标识不能为空");
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9][a-z0-9._-]{1,119}")) {
            throw new BlindboxValidationException("素材标识格式无效");
        }
        return normalized;
    }

    private void validateMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return;
        }
        if (metadataJson.length() > 20_000) {
            throw new BlindboxValidationException("素材元数据过大");
        }
        try {
            if (!objectMapper.readTree(metadataJson).isObject()) {
                throw new BlindboxValidationException("素材元数据必须是 JSON 对象");
            }
        } catch (JacksonException exception) {
            throw new BlindboxValidationException("素材元数据不是有效 JSON");
        }
    }

    private AssetView toView(ModelAsset asset) {
        return new AssetView(asset.getId(), asset.getOriginalFilename(), asset.getKind(), asset.getContentType(),
                asset.getSizeBytes(), asset.getFileUrl(), asset.getContentHash(), asset.getCreatedAt(),
                asset.getAssetKey(), asset.getQuality(), asset.getSkeletonVersion(), asset.getStatus(),
                readMetadata(asset.getMetadataJson()), asset.getUpdatedAt());
    }

    private Object readMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) return null;
        try {
            return objectMapper.readTree(metadataJson);
        } catch (JacksonException exception) {
            return null;
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record AssetDownload(PathResource resource, String contentType, String etag, long size) {}
}
