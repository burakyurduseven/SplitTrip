ALTER TABLE activity_vote DROP CONSTRAINT chk_activity_vote_value;
ALTER TABLE activity_vote ADD CONSTRAINT chk_activity_vote_value
    CHECK (vote_value IN ('LIKE', 'MAYBE', 'DISLIKE'));
