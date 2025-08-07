-- Initial schema for puzzle game database

-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT,
    tags TEXT, -- JSON array as text
    pieces INTEGER NOT NULL DEFAULT 0,
    img TEXT, -- JSON array of file links
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_puzzles_name ON puzzles(name);
