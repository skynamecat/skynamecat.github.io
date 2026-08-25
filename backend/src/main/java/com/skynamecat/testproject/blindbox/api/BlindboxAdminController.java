package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AssetUpdateRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.BatchVariantsRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.SeriesSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.VariantSaveRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationQaRequest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.PublishRequest;
import com.skynamecat.testproject.blindbox.entity.AssetKind;
import com.skynamecat.testproject.blindbox.service.AnimationClipService;
import com.skynamecat.testproject.blindbox.service.BlindboxService;
import com.skynamecat.testproject.blindbox.service.ModelAssetService;
import com.skynamecat.testproject.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/blindbox")
public class BlindboxAdminController {
    private final BlindboxService blindboxService;
    private final ModelAssetService assetService;
    private final AnimationClipService animationService;

    public BlindboxAdminController(BlindboxService blindboxService, ModelAssetService assetService,
                                   AnimationClipService animationService) {
        this.blindboxService = blindboxService;
        this.assetService = assetService;
        this.animationService = animationService;
    }

    @GetMapping("/session")
    ApiResponse<Map<String, String>> session(Authentication authentication, CsrfToken csrfToken) {
        return ApiResponse.success(Map.of("username", authentication.getName(), "csrfHeader", csrfToken.getHeaderName()));
    }

    @GetMapping("/series")
    ApiResponse<?> series() { return ApiResponse.success(blindboxService.listSeries()); }

    @GetMapping("/series/{seriesId}")
    ApiResponse<?> series(@PathVariable Long seriesId) { return ApiResponse.success(blindboxService.getSeries(seriesId)); }

    @PostMapping("/series")
    ApiResponse<?> createSeries(@Valid @RequestBody SeriesSaveRequest request) {
        return ApiResponse.success(blindboxService.createSeries(request));
    }

    @PutMapping("/series/{seriesId}")
    ApiResponse<?> updateSeries(@PathVariable Long seriesId, @Valid @RequestBody SeriesSaveRequest request) {
        return ApiResponse.success(blindboxService.updateSeries(seriesId, request));
    }

    @DeleteMapping("/series/{seriesId}")
    ApiResponse<?> deleteSeries(@PathVariable Long seriesId) {
        blindboxService.deleteSeries(seriesId);
        return ApiResponse.success(Map.of("deleted", true));
    }

    @PostMapping("/series/{seriesId}/variants")
    ApiResponse<?> createVariant(@PathVariable Long seriesId, @Valid @RequestBody VariantSaveRequest request) {
        return ApiResponse.success(blindboxService.createVariant(seriesId, request));
    }

    @PutMapping("/series/{seriesId}/variants/{variantId}")
    ApiResponse<?> updateVariant(@PathVariable Long seriesId, @PathVariable Long variantId,
                                 @Valid @RequestBody VariantSaveRequest request) {
        return ApiResponse.success(blindboxService.updateVariant(seriesId, variantId, request));
    }

    @PutMapping("/series/{seriesId}/variants/batch")
    ApiResponse<?> saveVariants(@PathVariable Long seriesId, @Valid @RequestBody BatchVariantsRequest request) {
        return ApiResponse.success(blindboxService.saveVariants(seriesId, request));
    }

    @DeleteMapping("/series/{seriesId}/variants/{variantId}")
    ApiResponse<?> deleteVariant(@PathVariable Long seriesId, @PathVariable Long variantId) {
        blindboxService.deleteVariant(seriesId, variantId);
        return ApiResponse.success(Map.of("deleted", true));
    }

    @PostMapping("/series/{seriesId}/publish")
    ApiResponse<?> publish(@PathVariable Long seriesId,
                           @Valid @RequestBody(required = false) PublishRequest request,
                           Authentication authentication) {
        var result = blindboxService.publish(seriesId, authentication.getName(), request == null ? null : request.note());
        return ApiResponse.success(blindboxService.getRelease(result.releaseId()));
    }

    @GetMapping("/series/{seriesId}/releases")
    ApiResponse<?> releases(@PathVariable Long seriesId) {
        return ApiResponse.success(blindboxService.releaseHistory(seriesId));
    }

    @GetMapping("/releases")
    ApiResponse<?> allReleases(@RequestParam(required = false) Long seriesId) {
        return ApiResponse.success(blindboxService.releaseHistory(seriesId));
    }

    @PostMapping("/releases/{releaseId}/rollback")
    ApiResponse<?> rollback(@PathVariable Long releaseId, Authentication authentication) {
        var result = blindboxService.rollback(releaseId, authentication.getName());
        return ApiResponse.success(blindboxService.getRelease(result.releaseId()));
    }

    @PostMapping("/series/{seriesId}/releases/{releaseId}/rollback")
    ApiResponse<?> rollback(@PathVariable Long seriesId, @PathVariable Long releaseId,
                            Authentication authentication) {
        return ApiResponse.success(blindboxService.rollback(seriesId, releaseId, authentication.getName()));
    }

    @GetMapping("/assets")
    ApiResponse<?> assets() { return ApiResponse.success(assetService.list()); }

    @PostMapping(value = "/assets", consumes = "multipart/form-data")
    ApiResponse<?> uploadAsset(@RequestParam AssetKind kind,
                               @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(assetService.upload(kind, file));
    }

    @PutMapping("/assets/{assetId}")
    ApiResponse<?> updateAsset(@PathVariable Long assetId, @Valid @RequestBody AssetUpdateRequest request) {
        return ApiResponse.success(assetService.update(assetId, request));
    }

    @DeleteMapping("/assets/{assetId}")
    ApiResponse<?> archiveAsset(@PathVariable Long assetId) {
        return ApiResponse.success(assetService.archive(assetId));
    }

    @GetMapping("/animations")
    ApiResponse<?> animations() { return ApiResponse.success(animationService.list()); }

    @GetMapping("/motions")
    ApiResponse<?> motions() { return ApiResponse.success(animationService.listQa()); }

    @org.springframework.web.bind.annotation.PatchMapping("/motions/{animationId}/qa")
    ApiResponse<?> reviewMotion(@PathVariable Long animationId, @Valid @RequestBody AnimationQaRequest request) {
        return ApiResponse.success(animationService.review(animationId, request));
    }

    @PostMapping("/animations")
    ApiResponse<?> createAnimation(@Valid @RequestBody AnimationSaveRequest request) {
        return ApiResponse.success(animationService.create(request));
    }

    @PutMapping("/animations/{animationId}")
    ApiResponse<?> updateAnimation(@PathVariable Long animationId, @Valid @RequestBody AnimationSaveRequest request) {
        return ApiResponse.success(animationService.update(animationId, request));
    }

    @DeleteMapping("/animations/{animationId}")
    ApiResponse<?> deleteAnimation(@PathVariable Long animationId) {
        animationService.delete(animationId);
        return ApiResponse.success(Map.of("deleted", true));
    }
}
