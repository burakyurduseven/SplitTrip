CREATE TABLE expense_attachment (
    id UUID PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES app_user(id),
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_attachment_size CHECK (size_bytes > 0 AND size_bytes <= 10485760)
);

CREATE INDEX idx_expense_attachment_expense ON expense_attachment(expense_id, created_at);
