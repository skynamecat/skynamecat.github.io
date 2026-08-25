package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationView;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationQaView;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationQaRequest;
import com.skynamecat.testproject.blindbox.entity.BlindboxAnimationClip;
import com.skynamecat.testproject.blindbox.entity.ModelAsset;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxVariantRepository;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class AnimationClipService {

    private final BlindboxAnimationClipRepository repository;
    private final BlindboxVariantRepository variantRepository;
    private final ModelAssetRepository assetRepository;
    private final ObjectMapper objectMapper;

    public AnimationClipService(BlindboxAnimationClipRepository repository,
                                BlindboxVariantRepository variantRepository,
                                ModelAssetRepository assetRepository,
                                ObjectMapper objectMapper) {
        this.repository = repository;
        this.variantRepository = variantRepository;
        this.assetRepository = assetRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AnimationView> list() {
        return repository.findAllByOrderByDisplayNameAsc().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<AnimationQaView> listQa() {
        return repository.findAllByOrderByDisplayNameAsc().stream().map(this::toQaView).toList();
    }

    @Transactional
    public AnimationQaView review(Long id, AnimationQaRequest request) {
        BlindboxAnimationClip clip = requireClip(id);
        clip.setQaStatus(request.qaStatus());
        clip.setQaNotes(blankToNull(request.notes()));
        return toQaView(repository.save(clip));
    }

    @Transactional
    public AnimationView create(AnimationSaveRequest request) {
        if (repository.existsByClipKey(request.clipKey())) {
            throw new BlindboxValidationException("动画片段标识已经存在");
        }
        BlindboxAnimationClip clip = new BlindboxAnimationClip();
        clip.setClipKey(request.clipKey().trim());
        apply(clip, request);
        return toView(repository.save(clip));
    }

    @Transactional
    public AnimationView update(Long id, AnimationSaveRequest request) {
        BlindboxAnimationClip clip = requireClip(id);
        if (!clip.getClipKey().equals(request.clipKey().trim())) {
            throw new BlindboxValidationException("动画片段标识创建后不能修改");
        }
        apply(clip, request);
        return toView(repository.save(clip));
    }

    @Transactional
    public void delete(Long id) {
        BlindboxAnimationClip clip = requireClip(id);
        if (variantRepository.existsByAnimationClip(clip.getClipKey())) {
            throw new BlindboxValidationException("动画片段正在被盲盒款式使用，不能删除");
        }
        repository.delete(clip);
    }

    private void apply(BlindboxAnimationClip clip, AnimationSaveRequest request) {
        validateMetadata(request.metadataJson());
        if (request.durationMs() != null && request.fadeInMs() + request.fadeOutMs() > request.durationMs()) {
            throw new BlindboxValidationException("淡入淡出总时长不能超过动画时长");
        }
        clip.setDisplayName(request.displayName().trim());
        clip.setDescription(blankToNull(request.description()));
        clip.setSourceAsset(resolveAsset(request.sourceAssetKey()));
        if (clip.getSourceAsset() != null) clip.setModelUrl(clip.getSourceAsset().getFileUrl());
        clip.setDurationMs(request.durationMs());
        clip.setLoopMode(request.loopMode());
        clip.setFadeInMs(request.fadeInMs());
        clip.setFadeOutMs(request.fadeOutMs());
        clip.setEnabled(request.enabled());
        clip.setMetadataJson(blankToNull(request.metadataJson()));
    }

    private ModelAsset resolveAsset(String assetKey) {
        if (assetKey == null || assetKey.isBlank()) return null;
        return assetRepository.findByAssetKey(assetKey.trim().toLowerCase())
                .orElseThrow(() -> new BlindboxValidationException("动画引用的素材不存在"));
    }

    private BlindboxAnimationClip requireClip(Long id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("动画片段不存在"));
    }

    private void validateMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) return;
        try {
            if (!objectMapper.readTree(metadataJson).isObject()) {
                throw new BlindboxValidationException("动画元数据必须是 JSON 对象");
            }
        } catch (JacksonException exception) {
            throw new BlindboxValidationException("动画元数据不是有效 JSON");
        }
    }

    private AnimationView toView(BlindboxAnimationClip clip) {
        return new AnimationView(clip.getId(), clip.getClipKey(), clip.getDisplayName(), clip.getDescription(),
                clip.getSourceAsset() == null ? null : clip.getSourceAsset().getAssetKey(), clip.getDurationMs(),
                clip.getLoopMode(), clip.getFadeInMs(), clip.getFadeOutMs(), clip.isEnabled(),
                readMetadata(clip.getMetadataJson()));
    }

    private AnimationQaView toQaView(BlindboxAnimationClip clip) {
        return new AnimationQaView(clip.getId(), clip.getClipKey(), clip.getDisplayName(), clip.getModelUrl(),
                clip.getDurationMs() == null ? 0.0 : clip.getDurationMs() / 1000.0,
                clip.getQaStatus(), clip.getQaNotes(), clip.getUpdatedAt());
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
}
