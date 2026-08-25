package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.service.BlindboxService;
import com.skynamecat.testproject.blindbox.service.ModelAssetService;
import com.skynamecat.testproject.common.api.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/public/blindbox")
public class BlindboxPublicController {
    private final BlindboxService blindboxService;
    private final ModelAssetService assetService;

    public BlindboxPublicController(BlindboxService blindboxService, ModelAssetService assetService) {
        this.blindboxService = blindboxService;
        this.assetService = assetService;
    }

    @GetMapping("/current")
    ApiResponse<?> currentManifest() {
        return ApiResponse.success(blindboxService.currentManifest());
    }

    @RequestMapping(method = RequestMethod.GET)
    ApiResponse<?> rootManifest() {
        return ApiResponse.success(blindboxService.currentManifest());
    }

    @GetMapping("/series/{seriesCode}/current")
    ApiResponse<?> current(@PathVariable String seriesCode) {
        return ApiResponse.success(blindboxService.current(seriesCode));
    }

    @GetMapping("/assets/{assetKey}")
    ResponseEntity<Resource> asset(@PathVariable String assetKey) {
        var download = assetService.downloadReady(assetKey);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .contentLength(download.size())
                .eTag("\"" + download.etag() + "\"")
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(download.resource());
    }
}
