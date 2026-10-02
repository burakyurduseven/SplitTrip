CREATE TABLE settlement (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES app_user(id),
    to_user_id UUID NOT NULL REFERENCES app_user(id),
    created_by UUID NOT NULL REFERENCES app_user(id),
    amount NUMERIC(19,2) NOT NULL,
    settlement_date DATE NOT NULL,
    note VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    voided_at TIMESTAMPTZ,
    CONSTRAINT chk_settlement_amount CHECK (amount > 0),
    CONSTRAINT chk_settlement_people CHECK (from_user_id <> to_user_id),
    CONSTRAINT chk_settlement_status CHECK (status IN ('ACTIVE', 'VOIDED'))
);

CREATE INDEX idx_settlement_trip_date ON settlement(trip_id, settlement_date DESC, created_at DESC);
