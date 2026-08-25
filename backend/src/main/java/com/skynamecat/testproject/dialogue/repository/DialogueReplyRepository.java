package com.skynamecat.testproject.dialogue.repository;

import com.skynamecat.testproject.dialogue.entity.DialogueReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DialogueReplyRepository extends JpaRepository<DialogueReply, Long> {

    List<DialogueReply> findByIntentIdOrderByIdAsc(Long intentId);
}
