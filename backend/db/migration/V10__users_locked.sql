-- Add locked flag to users
ALTER TABLE users ADD COLUMN locked INTEGER DEFAULT 0;
