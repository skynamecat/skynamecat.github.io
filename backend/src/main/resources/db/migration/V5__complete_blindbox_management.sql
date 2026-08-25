ALTER TABLE model_asset
    ADD COLUMN original_filename VARCHAR(255),
    ADD COLUMN content_type VARCHAR(120),
    ADD COLUMN storage_path VARCHAR(1000),
    ADD COLUMN asset_kind VARCHAR(20) NOT NULL DEFAULT 'MODEL',
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE model_asset
    ADD CONSTRAINT ck_model_asset_kind CHECK (asset_kind IN ('MODEL', 'TEXTURE', 'THUMBNAIL', 'AUDIO', 'OTHER'));

ALTER TABLE blindbox_series
    ADD COLUMN model_asset_key VARCHAR(120),
    ADD COLUMN current_release_id BIGINT;

ALTER TABLE blindbox_series
    ADD CONSTRAINT fk_blindbox_series_model_asset
        FOREIGN KEY (model_asset_key) REFERENCES model_asset(asset_key) ON DELETE SET NULL;

ALTER TABLE blindbox_release
    ADD COLUMN release_action VARCHAR(20) NOT NULL DEFAULT 'PUBLISH',
    ADD COLUMN source_release_id BIGINT,
    ADD COLUMN note VARCHAR(500);

ALTER TABLE blindbox_release
    ADD CONSTRAINT ck_blindbox_release_action CHECK (release_action IN ('PUBLISH', 'ROLLBACK')),
    ADD CONSTRAINT fk_blindbox_release_source
        FOREIGN KEY (source_release_id) REFERENCES blindbox_release(id) ON DELETE SET NULL;

ALTER TABLE blindbox_series
    ADD CONSTRAINT fk_blindbox_series_current_release
        FOREIGN KEY (current_release_id) REFERENCES blindbox_release(id) ON DELETE SET NULL;

UPDATE blindbox_series s
SET current_release_id = latest.id
FROM (
    SELECT DISTINCT ON (series_id) id, series_id
    FROM blindbox_release
    ORDER BY series_id, version DESC
) latest
WHERE latest.series_id = s.id;

CREATE INDEX idx_blindbox_series_current_release ON blindbox_series(current_release_id);

CREATE TABLE blindbox_animation_clip (
    id BIGSERIAL PRIMARY KEY,
    clip_key VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    source_asset_id BIGINT REFERENCES model_asset(id) ON DELETE SET NULL,
    model_url VARCHAR(1000) NOT NULL DEFAULT '/pangbobo/pangbobo-actions-complete.glb',
    duration_ms INTEGER,
    loop_mode VARCHAR(20) NOT NULL DEFAULT 'LOOP',
    fade_in_ms INTEGER NOT NULL DEFAULT 180,
    fade_out_ms INTEGER NOT NULL DEFAULT 180,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata_json TEXT,
    qa_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    qa_notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_blindbox_animation_duration CHECK (duration_ms IS NULL OR duration_ms > 0),
    CONSTRAINT ck_blindbox_animation_loop_mode CHECK (loop_mode IN ('ONCE', 'LOOP', 'PING_PONG')),
    CONSTRAINT ck_blindbox_animation_qa_status CHECK (qa_status IN ('PENDING', 'REVIEWING', 'PASSED', 'REJECTED')),
    CONSTRAINT ck_blindbox_animation_fades CHECK (fade_in_ms >= 0 AND fade_out_ms >= 0)
);

UPDATE blindbox_variant SET animation_clip = 'Lock' WHERE animation_clip = 'Locking';
UPDATE blindbox_variant SET animation_clip = 'Pop' WHERE animation_clip = 'Popping';

INSERT INTO blindbox_animation_clip
    (clip_key, display_name, model_url, duration_ms, loop_mode, qa_status, metadata_json)
VALUES
    ('ArmWave', '手臂波浪', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('BodyWave', '身体波浪', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Bounce', '律动弹跳', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Drink', '喝奶茶', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('EatCake', '吃蛋糕', '/pangbobo/pangbobo-actions-complete.glb', 2367, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Freeze', '定格', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('FunkBlast', '放克爆发', '/pangbobo/pangbobo-actions-complete.glb', 3167, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Groove', '律动', '/pangbobo/pangbobo-actions-complete.glb', 2367, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Happy', '开心一下', '/pangbobo/pangbobo-actions-complete.glb', 900, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Idle', '发发呆', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('KickStep', '踢踏步', '/pangbobo/pangbobo-actions-complete.glb', 2367, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Laptop', '看电脑', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Lock', '锁舞', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Look', '四处看看', '/pangbobo/pangbobo-actions-complete.glb', 2567, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Music', '听歌', '/pangbobo/pangbobo-actions-complete.glb', 1167, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Phone', '玩手机', '/pangbobo/pangbobo-actions-complete.glb', 2367, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Pop', '震感舞', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Rest', '歇一会', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Robot', '机器人舞', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Slide', '滑步', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Spin', '旋转', '/pangbobo/pangbobo-actions-complete.glb', 1967, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Stretch', '伸懒腰', '/pangbobo/pangbobo-actions-complete.glb', 1567, 'ONCE', 'PENDING', '{"loopRequired":false}'),
    ('Walk', '散散步', '/pangbobo/pangbobo-actions-complete.glb', 800, 'LOOP', 'PENDING', '{"loopRequired":true}'),
    ('Wave', '打招呼', '/pangbobo/pangbobo-actions-complete.glb', 1300, 'ONCE', 'PENDING', '{"loopRequired":false}')
ON CONFLICT (clip_key) DO NOTHING;

ALTER TABLE blindbox_variant
    ADD COLUMN thumbnail_asset_id BIGINT REFERENCES model_asset(id) ON DELETE SET NULL;

ALTER TABLE blindbox_variant
    ADD CONSTRAINT fk_blindbox_variant_animation_clip
        FOREIGN KEY (animation_clip) REFERENCES blindbox_animation_clip(clip_key) ON DELETE RESTRICT;

CREATE INDEX idx_blindbox_animation_asset ON blindbox_animation_clip(source_asset_id);
CREATE INDEX idx_model_asset_status_created ON model_asset(status, created_at DESC);
CREATE INDEX idx_blindbox_variant_thumbnail ON blindbox_variant(thumbnail_asset_id);
