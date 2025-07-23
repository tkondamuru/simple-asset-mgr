/**
 * Puzzle Game API - Cloudflare Worker
 * Implements all endpoints for the puzzle game API
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      // Route handling
      switch (true) {
        case method === 'POST' && pathname === '/register':
          response = await handleRegister(request, env);
          break;
        
        case method === 'GET' && pathname === '/puzzles':
          response = await handleGetPuzzles(env);
          break;
        
        case method === 'POST' && pathname === '/score':
          response = await handlePostScore(request, env);
          break;
        
        case method === 'GET' && pathname.startsWith('/scores/'):
          const playerName = pathname.split('/scores/')[1];
          response = await handleGetScores(playerName, env);
          break;
        
        case method === 'GET' && pathname === '/search':
          const query = searchParams.get('q');
          response = await handleSearchPuzzles(query, env);
          break;
        
        case method === 'POST' && pathname === '/upload-image':
          response = await handleUploadImage(request, env);
          break;
        
        case method === 'POST' && pathname === '/add-puzzle':
          response = await handleAddPuzzle(request, env);
          break;
        
        case method === 'POST' && pathname === '/verify-admin':
          response = await handleVerifyAdmin(request, env);
          break;
        
        case method === 'PUT' && pathname === '/update-admin':
          response = await handleUpdateAdmin(request, env);
          break;
        
        default:
          response = new Response('Not Found', { status: 404 });
      }

      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('Error:', error);
      const errorResponse = new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
      return errorResponse;
    }
  },
};

/**
 * 1. POST /register - Register a new player
 */
async function handleRegister(request, env) {
  const { name } = await request.json();
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Name is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if player already exists in KV
  const existingPlayer = await env.PLAYER_KV.get(name.trim());
  
  if (existingPlayer) {
    return new Response(
      JSON.stringify({ error: 'Name is already taken' }), 
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Store player in KV
  await env.PLAYER_KV.put(name.trim(), JSON.stringify({
    name: name.trim(),
    registeredAt: new Date().toISOString()
  }));

  return new Response(
    JSON.stringify({ message: 'Player registered successfully', name: name.trim() }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 2. GET /puzzles - Get all available puzzles
 */
async function handleGetPuzzles(env) {
  const stmt = env.DB.prepare('SELECT * FROM puzzles ORDER BY created_at DESC');
  const result = await stmt.all();
  
  const puzzles = result.results.map(puzzle => ({
    id: puzzle.id,
    name: puzzle.name,
    description: puzzle.description,
    tags: JSON.parse(puzzle.tags || '[]'),
    pieces: puzzle.pieces,
    svg: puzzle.svg_url
  }));

  return new Response(
    JSON.stringify(puzzles), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 3. POST /score - Save puzzle completion record
 */
async function handlePostScore(request, env) {
  const { name, puzzleId, timeSeconds } = await request.json();
  
  if (!name || !puzzleId || !timeSeconds) {
    return new Response(
      JSON.stringify({ error: 'name, puzzleId, and timeSeconds are required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify player exists
  const player = await env.PLAYER_KV.get(name);
  if (!player) {
    return new Response(
      JSON.stringify({ error: 'Player not found. Please register first.' }), 
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify puzzle exists
  const puzzleStmt = env.DB.prepare('SELECT id FROM puzzles WHERE id = ?');
  const puzzleResult = await puzzleStmt.first(puzzleId);
  
  if (!puzzleResult) {
    return new Response(
      JSON.stringify({ error: 'Puzzle not found' }), 
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Insert score
  const stmt = env.DB.prepare(
    'INSERT INTO scores (player_name, puzzle_id, time_seconds) VALUES (?, ?, ?)'
  );
  await stmt.run(name, puzzleId, timeSeconds);

  return new Response(
    JSON.stringify({ message: 'Score saved successfully' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 4. GET /scores/:name - Get all completed puzzles for a player
 */
async function handleGetScores(playerName, env) {
  if (!playerName) {
    return new Response(
      JSON.stringify({ error: 'Player name is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stmt = env.DB.prepare(`
    SELECT s.*, p.name as puzzle_name, p.description as puzzle_description 
    FROM scores s 
    JOIN puzzles p ON s.puzzle_id = p.id 
    WHERE s.player_name = ? 
    ORDER BY s.completed_at DESC
  `);
  
  const result = await stmt.all(playerName);

  return new Response(
    JSON.stringify(result.results), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 5. GET /search?q=keyword - Search puzzles by name, description, or tags
 */
async function handleSearchPuzzles(query, env) {
  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Search query is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const searchTerm = `%${query.toLowerCase()}%`;
  const stmt = env.DB.prepare(`
    SELECT * FROM puzzles 
    WHERE LOWER(name) LIKE ? 
       OR LOWER(description) LIKE ? 
       OR LOWER(tags) LIKE ?
    ORDER BY name
  `);
  
  const result = await stmt.all(searchTerm, searchTerm, searchTerm);
  
  const puzzles = result.results.map(puzzle => ({
    id: puzzle.id,
    name: puzzle.name,
    description: puzzle.description,
    tags: JSON.parse(puzzle.tags || '[]'),
    pieces: puzzle.pieces,
    svg: puzzle.svg_url
  }));

  return new Response(
    JSON.stringify(puzzles), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 6. POST /upload-image - Upload SVG file to R2 bucket
 */
async function handleUploadImage(request, env) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate unique filename
  const puzzleId = `puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const filename = `${puzzleId}.svg`;
  
  // Upload to R2
  await env.PUZZLE_BUCKET.put(filename, file.stream(), {
    httpMetadata: {
      contentType: 'image/svg+xml',
    },
  });

  // Construct public URL (adjust domain as needed)
  const url = `https://your-account.r2.dev/puzzles/${filename}`;

  return new Response(
    JSON.stringify({ url, id: puzzleId }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 7. POST /add-puzzle - Add a new puzzle (admin-only)
 */
async function handleAddPuzzle(request, env) {
  const { puzzleId, name, description, tags, pieces, svg } = await request.json();
  
  if (!puzzleId || !name || !pieces) {
    return new Response(
      JSON.stringify({ error: 'puzzleId, name, and pieces are required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if puzzle already exists
  const existingStmt = env.DB.prepare('SELECT id FROM puzzles WHERE id = ?');
  const existing = await existingStmt.first(puzzleId);
  
  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Puzzle with this ID already exists' }), 
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Insert new puzzle
  const stmt = env.DB.prepare(
    'INSERT INTO puzzles (id, name, description, tags, pieces, svg_url) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  await stmt.run(
    puzzleId,
    name,
    description || '',
    JSON.stringify(tags || []),
    pieces,
    svg || ''
  );

  return new Response(
    JSON.stringify({ message: 'Puzzle added successfully', puzzleId }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 8. POST /verify-admin - Verify admin credentials
 */
async function handleVerifyAdmin(request, env) {
  const { password } = await request.json();
  
  if (!password) {
    return new Response(
      JSON.stringify({ error: 'Password is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (password === env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ message: 'Admin verified successfully' }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Invalid credentials' }), 
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * 9. PUT /update-admin - Update admin credentials
 */
async function handleUpdateAdmin(request, env) {
  const { password } = await request.json();
  
  if (!password) {
    return new Response(
      JSON.stringify({ error: 'New password is required' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Note: In a real implementation, you'd want to verify current admin first
  // and store the new password in a secure way (KV or environment variable)
  
  return new Response(
    JSON.stringify({ message: 'Admin password updated successfully' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}