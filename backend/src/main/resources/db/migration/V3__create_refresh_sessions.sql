CREATE TABLE refresh_session (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uk_refresh_session_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_session_user_id ON refresh_session(user_id);
CREATE INDEX idx_refresh_session_expires_at ON refresh_session(expires_at);
