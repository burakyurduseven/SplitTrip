CREATE TABLE activity_idea (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES app_user(id),
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    location VARCHAR(160),
    estimated_duration_minutes INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_activity_duration CHECK (estimated_duration_minutes BETWEEN 15 AND 1440),
    CONSTRAINT chk_activity_status CHECK (status IN ('PROPOSED', 'SCHEDULED', 'ARCHIVED'))
);

CREATE TABLE activity_vote (
    id UUID PRIMARY KEY,
    activity_idea_id UUID NOT NULL REFERENCES activity_idea(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id),
    vote_value VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_activity_vote_idea_user UNIQUE (activity_idea_id, user_id),
    CONSTRAINT chk_activity_vote_value CHECK (vote_value IN ('LIKE', 'DISLIKE'))
);

CREATE TABLE itinerary_item (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    activity_idea_id UUID NOT NULL UNIQUE REFERENCES activity_idea(id) ON DELETE CASCADE,
    scheduled_by UUID NOT NULL REFERENCES app_user(id),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_itinerary_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_activity_idea_trip_status ON activity_idea(trip_id, status);
CREATE INDEX idx_activity_vote_idea ON activity_vote(activity_idea_id);
CREATE INDEX idx_itinerary_trip_date_time ON itinerary_item(trip_id, scheduled_date, start_time);
