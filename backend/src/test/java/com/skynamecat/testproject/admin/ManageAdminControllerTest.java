package com.skynamecat.testproject.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.math.BigDecimal;

import com.skynamecat.testproject.conversation.repository.UnmatchedUtteranceRepository;
import com.skynamecat.testproject.dialogue.entity.MatchType;
import com.skynamecat.testproject.dialogue.repository.DialogueIntentRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueReplyRepository;
import com.skynamecat.testproject.dialogue.repository.DialogueTriggerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;

class ManageAdminControllerTest {

    private DialogueIntentRepository intentRepository;
    private DialogueTriggerRepository triggerRepository;
    private DialogueReplyRepository replyRepository;
    private ManageAdminController controller;

    @BeforeEach
    void setUp() {
        intentRepository = mock(DialogueIntentRepository.class);
        triggerRepository = mock(DialogueTriggerRepository.class);
        replyRepository = mock(DialogueReplyRepository.class);
        controller = new ManageAdminController(
                intentRepository,
                triggerRepository,
                replyRepository,
                mock(UnmatchedUtteranceRepository.class));
    }

    @Test
    void rejectsUnsafeIntentCodeBeforeSaving() {
        RedirectAttributesModelMap redirect = new RedirectAttributesModelMap();

        String view = controller.createIntent("包含 空格", "测试", "", 0, redirect);

        assertThat(view).isEqualTo("redirect:/manage/intents");
        assertThat(redirect.getFlashAttributes()).containsKey("error");
        verifyNoInteractions(intentRepository);
    }

    @Test
    void rejectsInvalidRegularExpressionBeforeSaving() {
        RedirectAttributesModelMap redirect = new RedirectAttributesModelMap();

        String view = controller.createTrigger(
                1L, MatchType.REGEX, "[", BigDecimal.ONE, redirect);

        assertThat(view).isEqualTo("redirect:/manage/intents/1");
        assertThat(redirect.getFlashAttributes().get("error").toString()).contains("正则表达式无效");
        verifyNoInteractions(triggerRepository, intentRepository);
    }

    @Test
    void rejectsBlankReplyBeforeSaving() {
        RedirectAttributesModelMap redirect = new RedirectAttributesModelMap();

        String view = controller.createReply(1L, "  ", 1, redirect);

        assertThat(view).isEqualTo("redirect:/manage/intents/1");
        assertThat(redirect.getFlashAttributes()).containsKey("error");
        verifyNoInteractions(replyRepository, intentRepository);
    }

    @Test
    void dashboardAcceptsCanonicalPathWithOrWithoutTrailingSlash() throws NoSuchMethodException {
        GetMapping mapping = ManageAdminController.class
                .getDeclaredMethod("dashboard", Model.class)
                .getAnnotation(GetMapping.class);

        assertThat(mapping.value()).containsExactlyInAnyOrder("", "/");
    }

    @Test
    void intentListUsesDetachedSafeSummaries() {
        Model model = mock(Model.class);

        String view = controller.intents(model);

        assertThat(view).isEqualTo("manage/intents");
        verify(intentRepository).findAllSummaries();
    }
}
