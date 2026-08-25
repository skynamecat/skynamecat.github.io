package com.skynamecat.testproject.blindbox.service;

import com.skynamecat.testproject.blindbox.api.BlindboxDtos.AnimationSaveRequest;
import com.skynamecat.testproject.blindbox.entity.AnimationLoopMode;
import com.skynamecat.testproject.blindbox.entity.BlindboxAnimationClip;
import com.skynamecat.testproject.blindbox.repository.BlindboxAnimationClipRepository;
import com.skynamecat.testproject.blindbox.repository.BlindboxVariantRepository;
import com.skynamecat.testproject.blindbox.repository.ModelAssetRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnimationClipServiceTest {

    private final BlindboxAnimationClipRepository repository = mock(BlindboxAnimationClipRepository.class);
    private final BlindboxVariantRepository variants = mock(BlindboxVariantRepository.class);
    private final ModelAssetRepository assets = mock(ModelAssetRepository.class);
    private final AnimationClipService service = new AnimationClipService(repository, variants, assets,
            JsonMapper.builder().build());

    @Test
    void createsAnimationMetadata() {
        when(repository.existsByClipKey("Wave")).thenReturn(false);
        when(repository.save(any())).thenAnswer(invocation -> {
            BlindboxAnimationClip clip = invocation.getArgument(0);
            ReflectionTestUtils.setField(clip, "id", 3L);
            return clip;
        });

        var result = service.create(new AnimationSaveRequest("Wave", "打招呼", null, null,
                2400, AnimationLoopMode.ONCE, 120, 180, true, "{\"gesture\":true}"));

        assertThat(result.id()).isEqualTo(3L);
        assertThat(result.clipKey()).isEqualTo("Wave");
        assertThat(result.metadata()).isNotNull();
    }

    @Test
    void rejectsFadesLongerThanClipAndDeletionWhileUsed() {
        var invalid = new AnimationSaveRequest("Wave", "打招呼", null, null,
                200, AnimationLoopMode.ONCE, 150, 100, true, null);
        assertThatThrownBy(() -> service.create(invalid))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("总时长");

        BlindboxAnimationClip clip = new BlindboxAnimationClip();
        ReflectionTestUtils.setField(clip, "id", 3L);
        clip.setClipKey("Wave");
        when(repository.findById(3L)).thenReturn(java.util.Optional.of(clip));
        when(variants.existsByAnimationClip("Wave")).thenReturn(true);
        assertThatThrownBy(() -> service.delete(3L))
                .isInstanceOf(BlindboxValidationException.class)
                .hasMessageContaining("正在被");
    }
}
