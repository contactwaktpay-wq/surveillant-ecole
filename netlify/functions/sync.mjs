// Sauvegarde en ligne de l'application Surveillant (Netlify Functions + Netlify Blobs).
// Les données arrivent DÉJÀ CHIFFRÉES par le téléphone (AES-GCM) : le serveur ne peut pas les lire.
// La clé de stockage (id) est dérivée du code école + mot de passe : impossible à deviner.
import { getStore } from '@netlify/blobs';

const MAX = 5 * 1024 * 1024; // 5 Mo (données compressées + chiffrées)
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const validId = (id) => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id);

export default async (req) => {
  const store = getStore({ name: 'surveillant-ecole', consistency: 'strong' });
  const url = new URL(req.url);
  try {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (!validId(id)) return json({ error: 'bad_id' }, 400);
      if (url.searchParams.get('meta') === '1') {
        const m = await store.getMetadata(id);
        if (!m) return json({ error: 'not_found' }, 404);
        return json({ version: (m.metadata && m.metadata.version) || 0, at: (m.metadata && m.metadata.at) || 0 });
      }
      const r = await store.getWithMetadata(id, { type: 'text' });
      if (!r) return json({ error: 'not_found' }, 404);
      return json({ version: (r.metadata && r.metadata.version) || 0, at: (r.metadata && r.metadata.at) || 0, data: r.data });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const text = await req.text();
      if (text.length > MAX + 1000) return json({ error: 'too_big' }, 413);
      let body; try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad_json' }, 400); }
      const { id, base, data } = body || {};
      if (!validId(id) || typeof data !== 'string' || !data || data.length > MAX || !Number.isInteger(base) || base < 0) return json({ error: 'bad_request' }, 400);
      const metadata = { version: base + 1, at: Date.now() };
      if (base === 0) {
        const res = await store.set(id, data, { metadata, onlyIfNew: true });
        if (!res || !res.modified) { const m = await store.getMetadata(id); return json({ error: 'conflict', version: (m && m.metadata && m.metadata.version) || 0 }, 409); }
        return json({ version: metadata.version, at: metadata.at });
      }
      const cur = await store.getMetadata(id);
      const curVer = (cur && cur.metadata && cur.metadata.version) || 0;
      if (!cur || curVer !== base) return json({ error: 'conflict', version: curVer }, 409);
      const res = await store.set(id, data, { metadata, onlyIfMatch: cur.etag });
      if (!res || !res.modified) return json({ error: 'conflict', version: curVer }, 409);
      return json({ version: metadata.version, at: metadata.at });
    }
    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!validId(id)) return json({ error: 'bad_id' }, 400);
      await store.delete(id);
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  } catch (e) {
    return json({ error: 'server', message: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: '/api/sync' };
