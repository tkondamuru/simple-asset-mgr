-- Initial schema for puzzle game database

-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array as text
    pieces INTEGER NOT NULL DEFAULT 0,
    svg_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    time_seconds INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scores_player_name ON scores(player_name);
CREATE INDEX IF NOT EXISTS idx_scores_puzzle_id ON scores(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_name ON puzzles(name);

-- Insert some sample puzzles
INSERT OR REPLACE INTO puzzles (id, name, description, tags, pieces, svg_url) VALUES 
('puzzle-abc123', 'Space Grid', 'Align the stars', '["logic", "easy"]', 16, 'https://example.com/puzzles/puzzle-abc123.svg'),
('puzzle-def456', 'Ocean Waves', 'Connect the blue paths', '["water", "medium"]', 25, 'https://example.com/puzzles/puzzle-def456.svg'),
('puzzle-ghi789', 'Mountain Peak', 'Reach the summit', '["adventure", "hard"]', 36, 'https://example.com/puzzles/puzzle-ghi789.svg');