CREATE TABLE trip_invitation (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES app_user(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES app_user(id),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_trip_invitation_trip_id ON trip_invitation(trip_id);
CREATE INDEX idx_trip_invitation_expires_at ON trip_invitation(expires_at);
