package com.skynamecat.testproject.chat.service;

import com.skynamecat.testproject.chat.api.ChatRequest;
import com.skynamecat.testproject.chat.model.ChatReply;
import com.skynamecat.testproject.chat.provider.ChatProvider;
import com.skynamecat.testproject.conversation.entity.ConversationMessage;
import com.skynamecat.testproject.conversation.entity.ConversationSession;
import com.skynamecat.testproject.conversation.repository.ConversationMessageRepository;
import com.skynamecat.testproject.conversation.repository.ConversationSessionRepository;
import com.skynamecat.testproject.conversation.repository.UnmatchedUtteranceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatServiceTest {

    private final ChatProvider provider = mock(ChatProvider.class);
    private final ConversationSessionRepository sessions = mock(ConversationSessionRepository.class);
    private final ConversationMessageRepository messages = mock(ConversationMessageRepository.class);
    private final UnmatchedUtteranceRepository unmatched = mock(UnmatchedUtteranceRepository.class);
    private final ChatService service = new ChatService(provider, sessions, messages, unmatched);

    @Test
    void createsSessionPersistsMessagesAndReturnsFixedContract() {
        when(sessions.findById(any())).thenReturn(Optional.empty());
        when(sessions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        doAnswer(invocation -> {
            ConversationMessage message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", UUID.randomUUID());
            return message;
        }).when(messages).save(any());
        when(provider.reply("你好")).thenReturn(new ChatReply(
                "你好呀", "preset", "greeting", new BigDecimal("0.8500")
        ));

        var response = service.chat(new ChatRequest(null, " 你好 "));

        assertThat(response.sessionId()).isNotBlank();
        assertThat(response.messageId()).isNotBlank();
        assertThat(response.answer()).isEqualTo("你好呀");
        assertThat(response.provider()).isEqualTo("preset");
        assertThat(response.intent()).isEqualTo("greeting");
        assertThat(response.confidence()).isEqualByComparingTo("0.8500");
        verify(messages, org.mockito.Mockito.times(2)).save(any());
        verify(unmatched, never()).record(any(), any(), any(), any());
    }

    @Test
    void recordsUnmatchedQuestionAgainstExistingSession() {
        UUID sessionId = UUID.randomUUID();
        ConversationSession session = new ConversationSession(sessionId);
        when(sessions.findById(sessionId)).thenReturn(Optional.of(session));
        doAnswer(invocation -> {
            ConversationMessage message = invocation.getArgument(0);
            ReflectionTestUtils.setField(message, "id", UUID.randomUUID());
            return message;
        }).when(messages).save(any());
        when(provider.reply("未知问题")).thenReturn(new ChatReply(
                "记下来了", "preset", "fallback", BigDecimal.ZERO.setScale(4)
        ));

        service.chat(new ChatRequest(sessionId.toString(), "未知问题"));

        verify(unmatched).record(any(), any(), org.mockito.Mockito.eq("未知问题"), org.mockito.Mockito.eq("未知问题"));
    }

    @Test
    void rejectsMalformedSessionId() {
        assertThatThrownBy(() -> service.chat(new ChatRequest("not-a-uuid", "你好")))
                .isInstanceOf(InvalidChatRequestException.class)
                .hasMessageContaining("valid UUID");
    }
}
