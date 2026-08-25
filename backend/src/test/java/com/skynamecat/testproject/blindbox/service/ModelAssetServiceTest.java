package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.entity.AssetQuality;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxSeriesRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxVariantRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.storage.BlindboxAssetProperties;
import com.skynamecat.testproject.blindbox.storage.BlindboxAssetStorage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ModelAssetServiceTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void securelyStoresGlbAndCalculatesSha256() throws Exception {
        ModelAssetRepository repository = mock(ModelAssetRepository.class);
        when(repository.existsByAssetKey("pangbobo-main")).thenReturn(false);
        when(repository.save(any())).thenAnswer(invocation -> {
            Object asset = invocation.getArgument(0);
            ReflectionTestUtils.setField(asset, "id", 7L);
            return asset;
        });
        ModelAssetService service = service(repository, 1024);
        byte[] glb = {'g', 'l', 'T', 'F', 2, 0, 0, 0};

        var view = service.upload("pangbobo-main", AssetQuality.BALANCED, "rig-v1", "{\"lod\":2}",
                new MockMultipartFile("file", "pangbobo.glb", "model/gltf-binary", glb));

        assertThat(view.id()).isEqualTo(7L);
        assertThat(view.checksum()).hasSize(64);
        assertThat(view.size()).isEqualTo(glb.length);
        assertThat(Files.list(temporaryDirectory)).singleElement().matches(path -> path.toString().endsWith(".glb"));
    }

    @Test
    void rejectsTraversalFilenameAndInvalidMagic() {
        ModelAssetRepository repository = mock(ModelAssetRepository.class);
        ModelAssetService service = service(repository, 1024);

        assertThatThrownBy(() -> service.upload("safe-key", AssetQuality.LITE, "rig-v1", null,
                new MockMultipartFile("file", "../evil.glb", "model/gltf-binary", new byte[]{'g','l','T','F'})))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("文件名不安全");

        assertThatThrownBy(() -> service.upload("safe-key", AssetQuality.LITE, "rig-v1", null,
                new MockMultipartFile("file", "fake.glb", "model/gltf-binary", new byte[]{1,2,3,4})))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("不是有效的 GLB");
    }

    @Test
    void rejectsOversizedUploadAndMalformedMetadata() {
        ModelAssetRepository repository = mock(ModelAssetRepository.class);
        ModelAssetService service = service(repository, 6);

        assertThatThrownBy(() -> service.upload("safe-key", AssetQuality.FULL, "rig-v1", null,
                new MockMultipartFile("file", "large.glb", "model/gltf-binary",
                        new byte[]{'g','l','T','F',1,2,3})))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("最大大小");

        assertThatThrownBy(() -> service.upload("safe-key", AssetQuality.FULL, "rig-v1", "[]",
                new MockMultipartFile("file", "valid.glb", "model/gltf-binary",
                        new byte[]{'g','l','T','F'})))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("JSON 对象");
    }

    private ModelAssetService service(ModelAssetRepository repository, long maxSize) {
        BlindboxAssetProperties properties = new BlindboxAssetProperties();
        properties.setDirectory(temporaryDirectory);
        properties.setMaxSizeBytes(maxSize);
        BlindboxAssetStorage storage = new BlindboxAssetStorage(properties);
        return new ModelAssetService(repository, storage, JsonMapper.builder().build(),
                mock(BlindboxSeriesRepository.class), mock(BlindboxVariantRepository.class),
                mock(BlindboxAnimationClipRepository.class));
    }
}
