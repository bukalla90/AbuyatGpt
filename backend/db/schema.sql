CREATE TYPE conversation_role AS ENUM ('user', 'assistant');

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    role conversation_role NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);