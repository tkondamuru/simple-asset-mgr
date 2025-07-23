
# 🧩 Puzzle Game API using Cloudflare Workers

This document summarizes the API endpoints and their implementation using Cloudflare Workers, KV, D1, and R2.

---

## ⚙️ Cloudflare Stack

- **Cloudflare Workers** – Edge function runtime
- **KV (Key-Value) Storage** – For simple lookups
- **D1 (SQLite-based DB)** – For structured data and queries
- **R2** – For storing SVGs (optional)
- **React SPA** – For managing puzzles and testing endpoints

---

## ✅ API Endpoints

### 1. `POST /register`
Registers a new player by name.

#### Request:
```json
{ "name": "SunnyKid" }
```

#### Response:
- `200 OK` if success
- `409 Conflict` if name is taken

---

### 2. `GET /puzzles`
Returns all available puzzles.

#### Response:
```json
[
  {
    "id": "puzzle-abc123",
    "name": "Space Grid",
    "description": "Align the stars",
    "tags": ["logic", "easy"],
    "pieces": 16,
    "svg": "https://example.com/puzzles/puzzle-abc123.svg"
  }
]
```

---

### 3. `POST /score`
Saves puzzle completion record.

#### Request:
```json
{
  "name": "SunnyKid",
  "puzzleId": "puzzle-abc123",
  "timeSeconds": 87
}
```

---

### 4. `GET /scores/:name`
Returns all completed puzzles for a player.

---

### 5. `GET /search?q=keyword`
Search puzzles by name, description, or tags.

---

### 6. `POST /upload-image`
Uploads SVG file to R2 bucket.

#### Response:
```json
{ "url": "https://your-account.r2.dev/puzzles/xyz.svg", "id":"puzzle-abc123" }
```

---

### 7. `POST /add-puzzle`
Adds a new puzzle (admin-only).

#### Request:
```json
{
  "puzzleId": "puzzle-abc123",
  "name": "Star Maze",
  "description": "Find the path",
  "tags": ["maze", "medium"],
  "pieces": 25,
  "svg": "https://...r2.dev/star-maze.svg"
}
```

---

### 8. `POST /verify-admin`
Verifies admin credentials.
#### Response:
- `200 OK` if success
- `401 unauthorized` if mismatch

#### Request:
```json
{ "password": "admin123" }
```

---

---

### 9. `PUT /update-admin`
update admin credentials.

#### Request:
```json
{ "password": "admin123" }
```

---

## 🖥 React SPA Interface

### Features:
- Upload a new SVG image and get URL.
- Enter metadata and create new puzzle via `/add-puzzle`.
- View all puzzles using `/puzzles`.
- Search puzzles using `/search`.
- Register test player and simulate puzzle completion.

### Components:
- Puzzle list view with GET buttons to test `/puzzles` and `/search`.
- Admin form with inputs for name, description, tags, SVG URL, pieces, and `POST` to `/add-puzzle`.
- Image upload tool for `/upload-image`.

### Deployment:
Include the SPA in the same repo or as part of a Cloudflare Pages project with static assets and React build in `dist/` or `public/`.

---

## 🗂 GitHub + Deployment

- Use a single GitHub repo.
- Define bindings in `wrangler.toml`.
- Auto-deploy via Cloudflare Pages or Workers.

#### Example Binding in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "PLAYER_KV"
id = "xxxxxxxxxxxxxxxxxxxxx"
```

---

## 🔑 Get Namespace IDs
use the Cloudflare dashboard.

---

## 🧠 Suggestions

- Use KV for simple lookups (users).
- Use D1 for structured data (scores, puzzles).
- Use R2 for assets (SVGs).
- Use SPA for user-friendly admin interface and testing.

---

Happy Building! 🎉
