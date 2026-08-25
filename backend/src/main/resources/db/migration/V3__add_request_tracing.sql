CREATE TABLE request_log (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES conversation_session(id) ON DELETE SET NULL,
    actor VARCHAR(120),
    method VARCHAR(12) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms BIGINT NOT NULL,
    client_ip VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_request_log_created_at ON request_log(created_at DESC);
CREATE INDEX idx_request_log_session_id ON request_log(session_id);

ALTER TABLE conversation_message ADD COLUMN request_id UUID;
CREATE INDEX idx_conversation_message_request_id ON conversation_message(request_id);
