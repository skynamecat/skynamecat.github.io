package com.skynamecat.testproject.dialogue.repository;

import com.skynamecat.testproject.dialogue.entity.DialogueIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DialogueIntentRepository extends JpaRepository<DialogueIntent, Long> {

    Optional<DialogueIntent> findByCode(String code);

    List<DialogueIntent> findAllByOrderByPriorityDescNameAsc();

    @Query("""
            select new com.skynamecat.testproject.dialogue.repository.DialogueIntentSummary(
                intent.id,
                intent.code,
                intent.name,
                intent.priority,
                intent.enabled,
                count(distinct trigger.id),
                count(distinct reply.id)
            )
            from DialogueIntent intent
            left join intent.triggers trigger
            left join intent.replies reply
            group by intent.id, intent.code, intent.name, intent.priority, intent.enabled
            order by intent.priority desc, intent.name asc
            """)
    List<DialogueIntentSummary> findAllSummaries();

    List<DialogueIntent> findDistinctByEnabledTrueOrderByPriorityDescIdAsc();
}
