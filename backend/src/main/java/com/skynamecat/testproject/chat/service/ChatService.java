package com.skynamecat.testproject.chat.service;

import com.skynamecat.testproject.chat.api.ChatRequest;
import com.skynamecat.testproject.chat.api.ChatResponse;
import com.skynamecat.testproject.chat.model.ChatReply;
import com.skynamecat.testproject.chat.provider.ChatProvider;
import com.skynamecat.testproject.common.text.TextNormalizer;
import com.skynamecat.testproject.conversation.entity.ConversationMessage;
import com.skynamecat.testproject.conversation.entity.ConversationSession;
import com.skynamecat.testproject.conversation.repository.ConversationMessageRepository;
import com.skynamecat.testproject.conversation.repository.ConversationSessionRepository;
import com.skynamecat.testproject.conversation.repository.UnmatchedUtteranceRepository;
import com.skynamecat.testproject.observability.RequestTraceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ChatService {

    private final ChatProvider chatProvider;
    private final ConversationSessionRepository sessionRepository;
    private final ConversationMessageRepository messageRepository;
    private final UnmatchedUtteranceRepository unmatchedRepository;

    public ChatService(
            ChatProvider chatProvider,
            ConversationSessionRepository sessionRepository,
            ConversationMessageRepository messageRepository,
            UnmatchedUtteranceRepository unmatchedRepository
    ) {
        this.chatProvider = chatProvider;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.unmatchedRepository = unmatchedRepository;
    }

    @Transactional
    public ChatResponse chat(ChatRequest request) {
        UUID requestedSessionId = parseSessionId(request.sessionId());
        ConversationSession session = sessionRepository.findById(requestedSessionId)
                .orElseGet(() -> sessionRepository.save(new ConversationSession(requestedSessionId)));
        session.touch();
        RequestTraceContext.attachSession(session.getId());
        UUID requestId = RequestTraceContext.requestId();

        String messageText = request.message().trim();
        ConversationMessage userMessage = messageRepository.save(ConversationMessage.user(session, requestId, messageText));
        ChatReply reply = chatProvider.reply(messageText);
        ConversationMessage assistantMessage = messageRepository.save(ConversationMessage.assistant(
                session,
                requestId,
                reply.answer(),
                reply.provider(),
                reply.intent(),
                reply.confidence()
        ));

        if (reply.unmatched()) {
            unmatchedRepository.record(
                    session.getId(),
                    userMessage.getId(),
                    messageText,
                    TextNormalizer.normalize(messageText)
            );
        }

        return new ChatResponse(
                session.getId().toString(),
                assistantMessage.getId().toString(),
                reply.answer(),
                reply.provider(),
                reply.intent(),
                reply.confidence()
        );
    }

    private UUID parseSessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return UUID.randomUUID();
        }
        try {
            return UUID.fromString(sessionId.trim());
        } catch (IllegalArgumentException exception) {
            throw new InvalidChatRequestException("sessionId must be a valid UUID");
        }
    }
}
