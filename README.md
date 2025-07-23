# 🧩 Puzzle Game API with Cloudflare Workers

A complete puzzle game API built with Cloudflare Workers, featuring a React SPA admin interface for testing and management.

## 🌟 Features

### API Endpoints
- **Player Management**: Register players and track scores
- **Puzzle Management**: CRUD operations for puzzles
- **Search**: Full-text search across puzzles
- **File Upload**: SVG image upload to R2 storage
- **Admin Functions**: Secure admin panel with authentication

### React SPA Admin Interface
- **Beautiful UI**: Modern, responsive design with glassmorphism effects
- **Puzzle Management**: Add, view, and search puzzles
- **Image Upload**: Drag & drop SVG file uploads
- **Player Testing**: Register test players and simulate scores
- **Real-time Feedback**: Live API testing with visual feedback

## 🏗️ Tech Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Database**: D1 (SQLite-based distributed database)
- **Storage**: 
  - KV (Key-Value storage for player data)
  - R2 (Object storage for SVG files)
- **Frontend**: React + Vite
- **Styling**: Modern CSS with glassmorphism design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd puzzle-game-api
npm install
```

### 2. Install SPA Dependencies
```bash
npm run spa:install
```

### 3. Configure Cloudflare Resources

#### Create D1 Database
```bash
wrangler d1 create puzzle-game-db
```

#### Create KV Namespace
```bash
wrangler kv:namespace create "PLAYER_KV"
```

#### Create R2 Bucket
```bash
wrangler r2 bucket create puzzle-assets
```

#### Update wrangler.toml
Replace the placeholder IDs in `wrangler.toml` with the actual IDs from the commands above:

```toml
# Update these with your actual IDs
[[kv_namespaces]]
binding = "PLAYER_KV"
id = "your_kv_namespace_id_here"

[[d1_databases]]
binding = "DB"
database_name = "puzzle-game-db"
database_id = "your_d1_database_id_here"
```

### 4. Run Database Migrations
```bash
# For local development
npm run d1:local

# For production
npm run d1:migrate
```

### 5. Development

#### Start the API (Cloudflare Workers)
```bash
npm run dev
```
API will be available at `http://localhost:8787`

#### Start the React SPA (in a new terminal)
```bash
npm run spa:dev
```
SPA will be available at `http://localhost:5173`

## 📋 API Documentation

### Authentication
- Most endpoints are public
- Admin endpoints require password verification via `/verify-admin`
- Default admin password: `admin123` (change in `wrangler.toml`)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new player |
| GET | `/puzzles` | Get all puzzles |
| POST | `/score` | Save a puzzle completion score |
| GET | `/scores/:name` | Get player's completion history |
| GET | `/search?q=query` | Search puzzles |
| POST | `/upload-image` | Upload SVG to R2 |
| POST | `/add-puzzle` | Add new puzzle (admin) |
| POST | `/verify-admin` | Verify admin credentials |
| PUT | `/update-admin` | Update admin password |

### Example Usage

#### Register a Player
```bash
curl -X POST http://localhost:8787/register \
  -H "Content-Type: application/json" \
  -d '{"name": "SunnyKid"}'
```

#### Get All Puzzles
```bash
curl http://localhost:8787/puzzles
```

#### Search Puzzles
```bash
curl "http://localhost:8787/search?q=space"
```

#### Submit a Score
```bash
curl -X POST http://localhost:8787/score \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SunnyKid",
    "puzzleId": "puzzle-abc123",
    "timeSeconds": 87
  }'
```

## 🎨 React SPA Features

### Tabs Overview
1. **View Puzzles**: Browse all available puzzles with simulate score functionality
2. **Search Puzzles**: Real-time search with instant results
3. **Add Puzzle**: Admin form to create new puzzles
4. **Upload Image**: Drag & drop SVG file upload to R2
5. **Test Player**: Register test players and view scores
6. **Admin**: Secure admin authentication panel

### Admin Workflow
1. Go to **Admin** tab and enter password (`admin123`)
2. Upload SVG images in **Upload Image** tab
3. Use the uploaded URL in **Add Puzzle** tab
4. Test functionality in **Test Player** tab

## 🚀 Deployment

### Deploy to Cloudflare
```bash
npm run deploy
```

### Deploy SPA to Cloudflare Pages
1. Build the SPA:
   ```bash
   npm run build:spa
   ```

2. Create a Cloudflare Pages project and connect your repository

3. Set build settings:
   - **Build command**: `cd spa && npm run build`
   - **Build output directory**: `spa/dist`

### Environment Variables
Set these in your Cloudflare Workers environment:
- `ADMIN_PASSWORD`: Admin panel password
- `ENVIRONMENT`: `production` or `development`

## 🗄️ Database Schema

### Puzzles Table
```sql
CREATE TABLE puzzles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array
    pieces INTEGER NOT NULL,
    svg_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Scores Table
```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    time_seconds INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
);
```

## 🔧 Configuration

### wrangler.toml Configuration
```toml
name = "puzzle-game-api"
main = "src/index.js"
compatibility_date = "2023-12-01"

# KV for player data
[[kv_namespaces]]
binding = "PLAYER_KV"
id = "your_kv_id"

# D1 for structured data
[[d1_databases]]
binding = "DB"
database_name = "puzzle-game-db"
database_id = "your_d1_id"

# R2 for file storage
[[r2_buckets]]
binding = "PUZZLE_BUCKET"
bucket_name = "puzzle-assets"
```

## 🎯 Sample Data

The migration includes sample puzzles:
- **Space Grid**: Logic puzzle with 16 pieces
- **Ocean Waves**: Water-themed puzzle with 25 pieces  
- **Mountain Peak**: Adventure puzzle with 36 pieces

## 🛠️ Development Scripts

```bash
# Install dependencies
npm install && npm run spa:install

# Development
npm run dev          # Start Workers dev server
npm run spa:dev      # Start React dev server

# Building
npm run build        # Build both Worker and SPA
npm run build:worker # Build Worker only
npm run build:spa    # Build SPA only

# Database
npm run d1:migrate   # Run migrations (production)
npm run d1:local     # Run migrations (local)

# Deployment
npm run deploy       # Deploy Worker to Cloudflare
```

## 🔒 Security

- Admin endpoints protected by password verification
- CORS headers configured for cross-origin requests
- Input validation on all endpoints
- SQL injection protection with prepared statements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the SPA
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

---

**Happy Building!** 🎉

Built with ❤️ using Cloudflare Workers ecosystem.