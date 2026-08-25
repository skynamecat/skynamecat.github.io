CREATE TABLE dialogue_intent (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    priority INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dialogue_trigger (
    id BIGSERIAL PRIMARY KEY,
    intent_id BIGINT NOT NULL REFERENCES dialogue_intent(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL,
    pattern VARCHAR(500) NOT NULL,
    weight NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_dialogue_trigger_match_type CHECK (match_type IN ('EXACT', 'KEYWORD', 'REGEX')),
    CONSTRAINT ck_dialogue_trigger_weight CHECK (weight > 0 AND weight <= 1)
);

CREATE INDEX idx_dialogue_trigger_intent ON dialogue_trigger(intent_id);
CREATE INDEX idx_dialogue_trigger_enabled ON dialogue_trigger(enabled);

CREATE TABLE dialogue_reply (
    id BIGSERIAL PRIMARY KEY,
    intent_id BIGINT NOT NULL REFERENCES dialogue_intent(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_dialogue_reply_weight CHECK (weight > 0)
);

CREATE INDEX idx_dialogue_reply_intent ON dialogue_reply(intent_id);

CREATE TABLE conversation_session (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversation_message (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES conversation_session(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    provider VARCHAR(40),
    intent_code VARCHAR(64),
    confidence NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_conversation_message_role CHECK (role IN ('USER', 'ASSISTANT'))
);

CREATE INDEX idx_conversation_message_session_created
    ON conversation_message(session_id, created_at);

CREATE TABLE unmatched_utterance (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES conversation_session(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES conversation_message(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    normalized_content VARCHAR(1000) NOT NULL UNIQUE,
    occurrences INTEGER NOT NULL DEFAULT 1,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unmatched_resolved_last_seen
    ON unmatched_utterance(resolved, last_seen_at DESC);
