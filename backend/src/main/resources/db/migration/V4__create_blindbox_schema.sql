CREATE TABLE blindbox_series (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    theme VARCHAR(40) NOT NULL DEFAULT 'DAILY',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blindbox_variant (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT NOT NULL REFERENCES blindbox_series(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    rarity VARCHAR(20) NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    animation_clip VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_blindbox_variant_series_code UNIQUE (series_id, code),
    CONSTRAINT ck_blindbox_variant_rarity CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC')),
    CONSTRAINT ck_blindbox_variant_weight CHECK (weight >= 0)
);

CREATE INDEX idx_blindbox_variant_series_order ON blindbox_variant(series_id, display_order);

CREATE TABLE blindbox_release (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT NOT NULL REFERENCES blindbox_series(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL,
    content_json TEXT NOT NULL,
    published_by VARCHAR(120) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_blindbox_release_series_version UNIQUE (series_id, version)
);

CREATE INDEX idx_blindbox_release_series_version ON blindbox_release(series_id, version DESC);

CREATE TABLE model_asset (
    id BIGSERIAL PRIMARY KEY,
    asset_key VARCHAR(120) NOT NULL UNIQUE,
    file_url VARCHAR(1000) NOT NULL,
    content_hash VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    quality VARCHAR(20) NOT NULL,
    skeleton_version VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_model_asset_quality CHECK (quality IN ('LITE', 'BALANCED', 'FULL')),
    CONSTRAINT ck_model_asset_status CHECK (status IN ('UPLOADED', 'VALIDATING', 'READY', 'REJECTED', 'ARCHIVED'))
);

INSERT INTO blindbox_series (code, name, description, theme, display_order)
VALUES
    ('daily', '庞菠菠日常', '散步、休息和生活里的小动作。', 'DAILY', 10),
    ('hiphop', '庞菠菠律动', '街舞与节奏动作实验系列。', 'HIPHOP', 20);

INSERT INTO blindbox_variant (series_id, code, name, rarity, weight, display_order, animation_clip)
SELECT s.id, v.code, v.name, v.rarity, v.weight, v.display_order, v.animation_clip
FROM blindbox_series s
JOIN (VALUES
    ('daily','idle','发发呆','COMMON',20,10,'Idle'),
    ('daily','walk','散散步','COMMON',18,20,'Walk'),
    ('daily','rest','歇一会','COMMON',16,30,'Rest'),
    ('daily','stretch','伸懒腰','UNCOMMON',10,40,'Stretch'),
    ('daily','look','四处看看','COMMON',14,50,'Look'),
    ('daily','wave','打招呼','UNCOMMON',8,60,'Wave'),
    ('daily','phone','玩手机','UNCOMMON',7,70,'Phone'),
    ('daily','laptop','看电脑','RARE',3,80,'Laptop'),
    ('daily','happy','开心一下','UNCOMMON',7,90,'Happy'),
    ('daily','music','听歌','RARE',3,100,'Music'),
    ('daily','drink','喝奶茶','RARE',2,110,'Drink'),
    ('daily','cake','吃蛋糕','EPIC',1,120,'EatCake'),
    ('hiphop','bounce','Bounce','COMMON',18,10,'Bounce'),
    ('hiphop','body-wave','Body Wave','COMMON',16,20,'BodyWave'),
    ('hiphop','slide','Slide','COMMON',14,30,'Slide'),
    ('hiphop','arm-wave','Arm Wave','UNCOMMON',10,40,'ArmWave'),
    ('hiphop','locking','Locking','UNCOMMON',9,50,'Locking'),
    ('hiphop','popping','Popping','UNCOMMON',8,60,'Popping'),
    ('hiphop','groove','Groove','COMMON',13,70,'Groove'),
    ('hiphop','robot','Robot','RARE',4,80,'Robot'),
    ('hiphop','kick-step','Kick Step','UNCOMMON',7,90,'KickStep'),
    ('hiphop','spin','Spin','RARE',3,100,'Spin'),
    ('hiphop','freeze','Freeze','RARE',2,110,'Freeze'),
    ('hiphop','funk-blast','Funk Blast','EPIC',1,120,'FunkBlast')
) AS v(series_code, code, name, rarity, weight, display_order, animation_clip)
ON s.code = v.series_code;
