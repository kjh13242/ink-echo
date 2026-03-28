-- V001: rooms
CREATE TABLE IF NOT EXISTS rooms (
  id                   VARCHAR(16) PRIMARY KEY,
  code                 VARCHAR(10) UNIQUE,
  name                 VARCHAR(60)  NOT NULL,
  host_participant_id  VARCHAR(16),
  status               VARCHAR(20)  NOT NULL DEFAULT 'active',
  plan                 VARCHAR(10)  NOT NULL DEFAULT 'free',
  settings             JSONB        NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ended_at             TIMESTAMPTZ
);

-- V002: participants
CREATE TABLE IF NOT EXISTS participants (
  id          VARCHAR(16) PRIMARY KEY,
  room_id     VARCHAR(16) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname    VARCHAR(20) NOT NULL,
  avatar      VARCHAR(10) NOT NULL DEFAULT 'purple',
  is_host     BOOLEAN     NOT NULL DEFAULT FALSE,
  join_order  SMALLINT    NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at     TIMESTAMPTZ
);

-- V003: queue_tracks
CREATE TABLE IF NOT EXISTS queue_tracks (
  id           VARCHAR(16) PRIMARY KEY,
  room_id      VARCHAR(16) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  added_by     VARCHAR(16) NOT NULL REFERENCES participants(id),
  youtube_id   VARCHAR(20) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  artist       VARCHAR(100) NOT NULL DEFAULT '',
  thumbnail_url VARCHAR(300) NOT NULL DEFAULT '',
  duration_sec INTEGER     NOT NULL DEFAULT 0,
  message      VARCHAR(30),
  position     SMALLINT    NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  vote_count   SMALLINT    NOT NULL DEFAULT 0,
  played_at    TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V004: reactions
CREATE TABLE IF NOT EXISTS reactions (
  id             BIGSERIAL PRIMARY KEY,
  room_id        VARCHAR(16) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id VARCHAR(16) NOT NULL REFERENCES participants(id),
  type           VARCHAR(10) NOT NULL,  -- emoji | encore | vote
  emoji          VARCHAR(10),
  queue_id       VARCHAR(16),
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V005: echo_cards
CREATE TABLE IF NOT EXISTS echo_cards (
  id                VARCHAR(16) PRIMARY KEY,
  room_id           VARCHAR(16) NOT NULL REFERENCES rooms(id),
  room_name         VARCHAR(60) NOT NULL,
  host_nickname     VARCHAR(20) NOT NULL DEFAULT '',
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ NOT NULL,
  duration_min      INTEGER     NOT NULL DEFAULT 0,
  track_count       SMALLINT    NOT NULL DEFAULT 0,
  participant_count SMALLINT    NOT NULL DEFAULT 0,
  total_reactions   INTEGER     NOT NULL DEFAULT 0,
  encore_count      SMALLINT    NOT NULL DEFAULT 0,
  share_image_url   VARCHAR(300),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V006: echo_tracks
CREATE TABLE IF NOT EXISTS echo_tracks (
  id               BIGSERIAL PRIMARY KEY,
  echo_card_id     VARCHAR(16) NOT NULL REFERENCES echo_cards(id) ON DELETE CASCADE,
  queue_id         VARCHAR(16) NOT NULL,
  youtube_id       VARCHAR(20) NOT NULL,
  title            VARCHAR(200) NOT NULL,
  artist           VARCHAR(100) NOT NULL DEFAULT '',
  added_by_nickname VARCHAR(20) NOT NULL,
  message          VARCHAR(30),
  play_order       SMALLINT    NOT NULL,
  status           VARCHAR(20) NOT NULL,
  reaction_count   INTEGER     NOT NULL DEFAULT 0,
  top_emoji        VARCHAR(10),
  is_encore        BOOLEAN     NOT NULL DEFAULT FALSE
);

-- V007: 인덱스
CREATE INDEX IF NOT EXISTS idx_rooms_code          ON rooms(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rooms_status         ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_participants_room    ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_room_status ON participants(room_id, status);
CREATE INDEX IF NOT EXISTS idx_participants_order   ON participants(room_id, join_order);
CREATE INDEX IF NOT EXISTS idx_queue_room           ON queue_tracks(room_id);
CREATE INDEX IF NOT EXISTS idx_queue_room_pos       ON queue_tracks(room_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_room_status    ON queue_tracks(room_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_added_by       ON queue_tracks(added_by);
CREATE INDEX IF NOT EXISTS idx_reactions_room       ON reactions(room_id, type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_unique_emoji ON reactions(room_id, participant_id, emoji) WHERE type = 'emoji';
CREATE INDEX IF NOT EXISTS idx_reactions_vote       ON reactions(queue_id, type, is_active);
CREATE INDEX IF NOT EXISTS idx_echo_cards_room      ON echo_cards(room_id);
CREATE INDEX IF NOT EXISTS idx_echo_cards_created   ON echo_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_echo_tracks_card     ON echo_tracks(echo_card_id, play_order);
CREATE INDEX IF NOT EXISTS idx_echo_tracks_react    ON echo_tracks(echo_card_id, reaction_count DESC);
