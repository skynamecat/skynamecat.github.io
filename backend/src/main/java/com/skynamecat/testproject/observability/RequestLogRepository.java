package com.skynamecat.testproject.observability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RequestLogRepository extends JpaRepository<RequestLog, UUID> {
    List<RequestLog> findTop200ByOrderByCreatedAtDesc();
}
