CREATE TABLE trip (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES app_user(id),
    title VARCHAR(100) NOT NULL,
    destination VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    default_currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_trip_date_range CHECK (start_date <= end_date),
    CONSTRAINT chk_trip_currency CHECK (default_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_trip_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE TABLE trip_member (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id),
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    left_at TIMESTAMPTZ,
    CONSTRAINT uk_trip_member_trip_user UNIQUE (trip_id, user_id),
    CONSTRAINT chk_trip_member_role CHECK (role IN ('OWNER', 'MEMBER')),
    CONSTRAINT chk_trip_member_status CHECK (status IN ('ACTIVE', 'LEFT', 'REMOVED'))
);

CREATE INDEX idx_trip_owner_id ON trip(owner_id);
CREATE INDEX idx_trip_member_user_status ON trip_member(user_id, status);
