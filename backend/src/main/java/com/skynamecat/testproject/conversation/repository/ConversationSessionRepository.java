package com.skynamecat.testproject.conversation.repository;

import com.skynamecat.testproject.conversation.entity.ConversationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConversationSessionRepository extends JpaRepository<ConversationSession, UUID> {
}
