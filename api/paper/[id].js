/* Vercel Function: GET /api/paper/<id> returns a paper saved by the connector (the app's #/import/<id> page reads it). */
import { store } from '../../server/store.js';
import { CORS } from '../../server/mcp.js';

const reply = (body, status) => new Response(body, { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });

export async function GET(request) {
  const id = new URL(request.url, 'http://localhost').pathname.split('/').pop();
  if (!/^[a-z0-9]{6,20}$/.test(id)) return reply('{"error":"not found"}', 404);
  try {
    const body = await store.get(id);
    return body ? reply(body, 200) : reply('{"error":"not found"}', 404);
  } catch {
    return reply('{"error":"storage unavailable"}', 503);
  }
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
