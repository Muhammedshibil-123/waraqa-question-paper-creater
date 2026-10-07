/* Vercel Function: the MCP connector. Add https://<your-site>/api/mcp to ChatGPT or Claude. */
import { handleMcp } from '../server/mcp.js';
import { store } from '../server/store.js';

function origin(request) {
  const h = request.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  return host ? `${h.get('x-forwarded-proto') || 'https'}://${host}` : new URL(request.url).origin;
}

const handle = (request) => handleMcp(request, { store, appUrl: process.env.APP_URL || `${origin(request)}/` });

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS };
