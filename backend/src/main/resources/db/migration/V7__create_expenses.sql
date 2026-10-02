CREATE TABLE expense (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES app_user(id),
    created_by UUID NOT NULL REFERENCES app_user(id),
    title VARCHAR(120) NOT NULL,
    amount NUMERIC(19,2) NOT NULL,
    expense_date DATE NOT NULL,
    split_method VARCHAR(20) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_expense_amount CHECK (amount > 0),
    CONSTRAINT chk_expense_split_method CHECK (split_method IN ('EQUAL', 'EXACT', 'PERCENTAGE'))
);

CREATE TABLE expense_share (
    id UUID PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id),
    amount NUMERIC(19,2) NOT NULL,
    percentage NUMERIC(5,2),
    CONSTRAINT uk_expense_share_user UNIQUE (expense_id, user_id),
    CONSTRAINT chk_expense_share_amount CHECK (amount >= 0),
    CONSTRAINT chk_expense_share_percentage CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100))
);

CREATE INDEX idx_expense_trip_date ON expense(trip_id, expense_date DESC, created_at DESC);
CREATE INDEX idx_expense_share_user ON expense_share(user_id);
