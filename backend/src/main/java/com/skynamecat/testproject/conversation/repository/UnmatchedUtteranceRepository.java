package com.skynamecat.testproject.conversation.repository;

import com.skynamecat.testproject.conversation.entity.UnmatchedUtterance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UnmatchedUtteranceRepository extends JpaRepository<UnmatchedUtterance, Long> {

    List<UnmatchedUtterance> findAllByOrderByResolvedAscLastSeenAtDesc();

    @Modifying
    @Query(value = """
            INSERT INTO unmatched_utterance
                (session_id, message_id, content, normalized_content, occurrences, resolved, first_seen_at, last_seen_at)
            VALUES (:sessionId, :messageId, :content, :normalizedContent, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (normalized_content) DO UPDATE SET
                session_id = EXCLUDED.session_id,
                message_id = EXCLUDED.message_id,
                content = EXCLUDED.content,
                occurrences = unmatched_utterance.occurrences + 1,
                last_seen_at = CURRENT_TIMESTAMP
            """, nativeQuery = true)
    void record(
            @Param("sessionId") UUID sessionId,
            @Param("messageId") UUID messageId,
            @Param("content") String content,
            @Param("normalizedContent") String normalizedContent
    );
}
