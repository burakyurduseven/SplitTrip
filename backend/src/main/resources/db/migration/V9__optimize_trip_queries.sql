DROP INDEX IF EXISTS idx_activity_idea_trip_status;
CREATE INDEX idx_activity_idea_trip_status_created
    ON activity_idea(trip_id, status, created_at DESC);

CREATE INDEX idx_trip_member_trip_active_order
    ON trip_member(trip_id, role DESC, joined_at)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_settlement_trip_active
    ON settlement(trip_id)
    WHERE status = 'ACTIVE';
