package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.service.BlindboxService;
import com.skynamecat.testproject.common.api.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/blindbox")
public class BlindboxPublicController {
    private final BlindboxService blindboxService;
    public BlindboxPublicController(BlindboxService blindboxService) { this.blindboxService = blindboxService; }

    @GetMapping("/series/{seriesCode}/current")
    ApiResponse<?> current(@PathVariable String seriesCode) {
        return ApiResponse.success(blindboxService.current(seriesCode));
    }
}
