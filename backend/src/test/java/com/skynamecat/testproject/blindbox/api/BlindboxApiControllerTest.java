package com.skynamecat.testproject.blindbox.api;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationQaView;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.CurrentManifest;
import com.skynamecat.testproject.blindbox.api.BlindboxDtos.ReleaseView;
import com.skynamecat.testproject.blindbox.entity.AnimationQaStatus;
import com.skynamecat.testproject.blindbox.entity.AssetKind;
import com.skynamecat.testproject.blindbox.entity.ReleaseAction;
import com.skynamecat.testproject.blindbox.entity.ReleaseStatus;
import com.skynamecat.testproject.blindbox.service.AnimationClipService;
import com.skynamecat.testproject.blindbox.service.BlindboxService;
import com.skynamecat.testproject.blindbox.service.ModelAssetService;
import com.skynamecat.testproject.common.api.ApiExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BlindboxApiControllerTest {

    private final BlindboxService blindboxService = mock(BlindboxService.class);
    private final ModelAssetService assetService = mock(ModelAssetService.class);
    private final AnimationClipService animationService = mock(AnimationClipService.class);
    private MockMvc publicMvc;
    private MockMvc adminMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        publicMvc = MockMvcBuilders.standaloneSetup(new BlindboxPublicController(blindboxService, assetService)).build();
        adminMvc = MockMvcBuilders.standaloneSetup(
                        new BlindboxAdminController(blindboxService, assetService, animationService))
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void exposesAggregateManifestAtRootAndCurrentAlias() throws Exception {
        var manifest = new CurrentManifest(1, Instant.parse("2026-08-25T00:00:00Z"), List.of());
        when(blindboxService.currentManifest()).thenReturn(manifest);

        publicMvc.perform(get("/api/public/blindbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.schemaVersion").value(1));
        publicMvc.perform(get("/api/public/blindbox/current"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.series").isArray());
    }

    @Test
    void acceptsFrontendMultipartAssetContract() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "pangbobo.glb",
                "model/gltf-binary", new byte[]{'g','l','T','F'});

        adminMvc.perform(multipart("/api/admin/blindbox/assets")
                        .file(file)
                        .param("kind", "MODEL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        verify(assetService).upload(eq(AssetKind.MODEL), any());
    }

    @Test
    void exposesMotionQaContract() throws Exception {
        var view = new AnimationQaView(1L, "Walk", "散步", "/pangbobo/model.glb", 0.8,
                AnimationQaStatus.PENDING, null, Instant.parse("2026-08-25T00:00:00Z"));
        when(animationService.review(eq(1L), any())).thenReturn(view);

        adminMvc.perform(patch("/api/admin/blindbox/motions/1/qa")
                        .contentType("application/json")
                        .content("{\"qaStatus\":\"PASSED\",\"notes\":\"动作自然\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Walk"))
                .andExpect(jsonPath("$.data.qaStatus").value("PENDING"));
    }

    @Test
    void releaseEndpointReturnsFrontendReleaseShape() throws Exception {
        var release = new ReleaseView(9L, 2L, "庞菠菠日常", 3, ReleaseStatus.PUBLISHED,
                12, "admin", Instant.parse("2026-08-25T00:00:00Z"), "调整权重",
                ReleaseAction.PUBLISH, null);
        when(blindboxService.releaseHistory(null)).thenReturn(List.of(release));

        adminMvc.perform(get("/api/admin/blindbox/releases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(9))
                .andExpect(jsonPath("$.data[0].seriesId").value(2))
                .andExpect(jsonPath("$.data[0].status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data[0].variantCount").value(12));
    }
}
