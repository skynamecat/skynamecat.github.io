package com.skynamecat.testproject.dialogue.repository;

import com.skynamecat.testproject.dialogue.entity.DialogueTrigger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DialogueTriggerRepository extends JpaRepository<DialogueTrigger, Long> {

    List<DialogueTrigger> findByIntentIdOrderByIdAsc(Long intentId);
}
