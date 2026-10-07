/* Where AI-made papers wait (30 days) until the link is opened.
   Production: Upstash Redis REST API. Adding "Upstash for Redis" from the Vercel Marketplace sets
   KV_REST_API_URL / KV_REST_API_TOKEN (UPSTASH_REDIS_REST_* also work).
   Local runs without those keep papers in memory. */
const mem = new Map();
const env = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function redis(cmd) {
  const { url, token } = env();
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `storage error ${r.status}`);
  return j.result;
}

const ready = () => { const { url, token } = env(); return !!(url && token); };

export const store = {
  async put(id, json, ttl) {
    if (ready()) return redis(['SET', `paper:${id}`, json, 'EX', String(ttl)]);
    if (process.env.VERCEL) throw new Error('paper storage is not set up (add Upstash Redis to the Vercel project)');
    mem.set(id, json);
  },
  async get(id) {
    if (ready()) return redis(['GET', `paper:${id}`]);
    return mem.get(id) ?? null;
  },
};
