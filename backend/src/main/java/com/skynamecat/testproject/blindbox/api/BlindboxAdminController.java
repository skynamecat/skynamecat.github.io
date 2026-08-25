package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.service.BlindboxService;
import com.skynamecat.testproject.common.api.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/blindbox")
public class BlindboxAdminController {
    private final BlindboxService blindboxService;
    public BlindboxAdminController(BlindboxService blindboxService) { this.blindboxService = blindboxService; }

    @GetMapping("/session")
    ApiResponse<Map<String, String>> session(Authentication authentication, CsrfToken csrfToken) {
        return ApiResponse.success(Map.of("username", authentication.getName(), "csrfHeader", csrfToken.getHeaderName()));
    }

    @GetMapping("/series")
    ApiResponse<?> series() { return ApiResponse.success(blindboxService.listSeries()); }

    @PostMapping("/series/{seriesId}/publish")
    ApiResponse<?> publish(@PathVariable Long seriesId, Authentication authentication) {
        return ApiResponse.success(blindboxService.publish(seriesId, authentication.getName()));
    }
}
