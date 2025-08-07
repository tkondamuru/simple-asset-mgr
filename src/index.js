/**
 * Simple Asset Manager API - Cloudflare Worker
 *
 * Endpoints:
 * - GET /api/puzzles: Returns a list of all puzzles.
 * - POST /api/puzzles: Adds a new puzzle with multiple file uploads.
 * - GET /api/puzzles/:id: Returns a single puzzle.
 * - PUT /api/puzzles/:id: Updates a puzzle.
 * - DELETE /api/puzzles/:id: Deletes a puzzle.
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    let response;
    try {
      // Handle API routes
      if (pathname.startsWith('/api/')) {
        const apiPath = pathname.replace(/^(\/api)/, '');
        const segments = apiPath.split('/').filter(Boolean);
        
        if (segments[0] === 'puzzles') {
          const puzzleId = segments[1];
          
          switch (method) {
            case 'GET':
              response = puzzleId
                ? await getPuzzle(puzzleId, env)
                : await getPuzzles(env);
              break;
            case 'POST':
              response = await addPuzzle(request, env);
              break;
            case 'PUT':
              response = puzzleId
                ? await updatePuzzle(request, puzzleId, env)
                : new Response('Not Found', { status: 404 });
              break;
            case 'DELETE':
              response = puzzleId
                ? await deletePuzzle(puzzleId, env)
                : new Response('Not Found', { status: 404 });
              break;
            default:
              response = new Response('Method Not Allowed', { status: 405 });
          }
        } else {
          response = new Response('Not Found', { status: 404 });
        }
      } else {
        // Handle static assets and SPA routing
        try {
          response = await getAssetFromKV(
            {
              request,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
              // For SPA routing, serve index.html for all non-asset requests
              mapRequestToAsset: (req) => {
                const url = new URL(req.url);
                // If it's a file with extension, serve it as-is
                if (url.pathname.includes('.')) {
                  return new Request(req.url, req);
                }
                // Otherwise, serve index.html for SPA routing
                const indexUrl = new URL('/index.html', req.url);
                return new Request(indexUrl.toString(), req);
              },
            }
          );
        } catch (e) {
          // If asset not found, serve index.html for SPA routing
          try {
            response = await getAssetFromKV(
              {
                request: new Request(new URL('/index.html', request.url).toString(), request),
                waitUntil: ctx.waitUntil.bind(ctx),
              },
              {
                ASSET_NAMESPACE: env.__STATIC_CONTENT,
                ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
              }
            );
          } catch (e) {
            response = new Response('Not Found', { status: 404 });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      response = new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },
};

// GET /puzzles
async function getPuzzles(env) {
  const { results } = await env.DB.prepare('SELECT * FROM puzzles ORDER BY created_at DESC').all();
  
  const puzzles = results.map(p => ({
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    img: JSON.parse(p.img || '[]'),
  }));

  return new Response(JSON.stringify(puzzles), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /puzzles/:id
async function getPuzzle(id, env) {
  const puzzle = await env.DB.prepare('SELECT * FROM puzzles WHERE id = ?').bind(id).first();

  if (!puzzle) {
    return new Response('Puzzle not found', { status: 404 });
  }
  
  puzzle.tags = JSON.parse(puzzle.tags || '[]');
  puzzle.img = JSON.parse(puzzle.img || '[]');

  return new Response(JSON.stringify(puzzle), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /puzzles
async function addPuzzle(request, env) {
  const formData = await request.formData();
  const puzzleId = `puzzle-${Date.now()}`;
  
  const puzzleData = {
    name: formData.get('name'),
    desc: formData.get('desc'),
    pieces: formData.get('pieces'),
    level: formData.get('level'),
    tags: formData.get('tags'),
  };

  const uploadedFiles = [];
  for (const file of formData.getAll('files')) {
    if (file.name) {
      const key = `${puzzleId}/${file.name}`;
      await env.PUZZLE_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      uploadedFiles.push(key);
    }
  }

  await env.DB.prepare(
    'INSERT INTO puzzles (id, name, description, pieces, level, tags, img) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    puzzleId,
    puzzleData.name,
    puzzleData.desc,
    puzzleData.pieces,
    puzzleData.level,
    JSON.stringify(puzzleData.tags.split(',').map(t => t.trim())),
    JSON.stringify(uploadedFiles)
  ).run();

  return new Response(JSON.stringify({ id: puzzleId, ...puzzleData, img: uploadedFiles }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

// PUT /puzzles/:id
async function updatePuzzle(request, id, env) {
  const formData = await request.formData();
  
  const puzzleData = {
    name: formData.get('name'),
    desc: formData.get('desc'),
    pieces: formData.get('pieces'),
    level: formData.get('level'),
    tags: formData.get('tags'),
  };

  const uploadedFiles = JSON.parse(formData.get('existingFiles') || '[]');
  for (const file of formData.getAll('files')) {
    if (file.name) {
      const key = `${id}/${file.name}`;
      await env.PUZZLE_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      uploadedFiles.push(key);
    }
  }

  await env.DB.prepare(
    'UPDATE puzzles SET name = ?, description = ?, pieces = ?, level = ?, tags = ?, img = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(
    puzzleData.name,
    puzzleData.desc,
    puzzleData.pieces,
    puzzleData.level,
    JSON.stringify(puzzleData.tags.split(',').map(t => t.trim())),
    JSON.stringify(uploadedFiles),
    id
  ).run();

  return new Response(JSON.stringify({ id, ...puzzleData, img: uploadedFiles }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /puzzles/:id
async function deletePuzzle(id, env) {
  const puzzle = await env.DB.prepare('SELECT img FROM puzzles WHERE id = ?').bind(id).first();
  
  if (puzzle) {
    const images = JSON.parse(puzzle.img || '[]');
    if (images.length > 0) {
      // Consider bulk deletion for production
      for (const key of images) {
        await env.PUZZLE_BUCKET.delete(key);
      }
    }
  }

  await env.DB.prepare('DELETE FROM puzzles WHERE id = ?').bind(id).run();

  return new Response(null, { status: 204 });
}
