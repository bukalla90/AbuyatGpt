CREATE TYPE conversation_role AS ENUM ('user', 'assistant');

-- A browser/user can own many independent chat sessions.
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role conversation_role NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX conversations_chat_id_created_at_idx
    ON conversations (chat_id, created_at, id);

CREATE INDEX chat_sessions_user_id_idx ON chat_sessions (user_id);
