package com.skynamecat.testproject.observability;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "request_log")
public class RequestLog {
    @Id
    private UUID id;
    @Column(name = "session_id")
    private UUID sessionId;
    @Column(length = 120)
    private String actor;
    @Column(nullable = false, length = 12)
    private String method;
    @Column(nullable = false, length = 500)
    private String path;
    @Column(name = "status_code", nullable = false)
    private int statusCode;
    @Column(name = "duration_ms", nullable = false)
    private long durationMs;
    @Column(name = "client_ip", length = 64)
    private String clientIp;
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RequestLog() { }

    public RequestLog(UUID id, UUID sessionId, String actor, String method, String path,
                      int statusCode, long durationMs, String clientIp, String userAgent) {
        this.id = id;
        this.sessionId = sessionId;
        this.actor = actor;
        this.method = method;
        this.path = path;
        this.statusCode = statusCode;
        this.durationMs = durationMs;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
    }

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public String getActor() { return actor; }
    public String getMethod() { return method; }
    public String getPath() { return path; }
    public int getStatusCode() { return statusCode; }
    public long getDurationMs() { return durationMs; }
    public String getClientIp() { return clientIp; }
    public String getUserAgent() { return userAgent; }
    public Instant getCreatedAt() { return createdAt; }
}
