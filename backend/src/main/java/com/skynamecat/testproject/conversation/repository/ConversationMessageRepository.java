package com.skynamecat.testproject.conversation.repository;

import com.skynamecat.testproject.conversation.entity.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {
    List<ConversationMessage> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
