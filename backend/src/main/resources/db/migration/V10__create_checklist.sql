CREATE TABLE checklist_item (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES app_user(id),
    created_by UUID NOT NULL REFERENCES app_user(id),
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    assigned_to_everyone BOOLEAN NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_checklist_assignment CHECK (
        (assigned_to_everyone AND assignee_id IS NULL)
        OR (NOT assigned_to_everyone AND assignee_id IS NOT NULL)
    ),
    CONSTRAINT chk_checklist_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT chk_checklist_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE INDEX idx_checklist_trip_status_due
    ON checklist_item(trip_id, status, due_date, created_at);
CREATE INDEX idx_checklist_assignee
    ON checklist_item(assignee_id) WHERE assignee_id IS NOT NULL;
