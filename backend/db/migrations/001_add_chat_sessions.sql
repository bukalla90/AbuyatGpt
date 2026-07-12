-- Run this once on an existing database created from the old schema.
-- Existing messages are retained in one legacy chat; all new messages use
-- their own chat and anonymous browser user IDs.

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO chat_sessions (id, user_id)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS chat_id UUID;

UPDATE conversations
SET chat_id = '00000000-0000-4000-8000-000000000001'
WHERE chat_id IS NULL;

ALTER TABLE conversations ALTER COLUMN chat_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'conversations_chat_id_fkey'
    ) THEN
        ALTER TABLE conversations
            ADD CONSTRAINT conversations_chat_id_fkey
            FOREIGN KEY (chat_id)
            REFERENCES chat_sessions(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS conversations_chat_id_created_at_idx
    ON conversations (chat_id, created_at, id);

CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
    ON chat_sessions (user_id);
