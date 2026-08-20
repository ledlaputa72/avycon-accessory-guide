// Serverless function: SHARED version history (snapshots), stored as one JSON blob in Vercel Blob.
// Everyone who opens the site sees the same saved versions.
//   GET  /api/history  -> { snapshots: [...] }        (the shared history)
//   POST /api/history  -> body { snapshots: [...] }    (overwrites the shared history)
// Requires BLOB_READ_WRITE_TOKEN, which Vercel injects once a Blob store is connected to the project.
const { put, list } = require('@vercel/blob');

const BLOB_PATH = 'accessory-history/history.json';

async function readRawBody(req) {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: 'Blob store not configured (missing BLOB_READ_WRITE_TOKEN)' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
      if (blobs && blobs.length && blobs[0].url) {
        const r = await fetch(blobs[0].url + '?ts=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
          const json = await r.json();
          res.status(200).json(json && Array.isArray(json.snapshots) ? json : { snapshots: [] });
          return;
        }
      }
      res.status(200).json({ snapshots: [] });
      return;
    }

    if (req.method === 'POST') {
      const buffer = await readRawBody(req);
      let json = null;
      try { json = JSON.parse(buffer.toString('utf-8') || '{}'); } catch (e) { json = null; }
      if (!json || typeof json !== 'object' || !Array.isArray(json.snapshots)) {
        res.status(400).json({ error: 'Body must be { snapshots: [...] }' });
        return;
      }
      // Keep at most 20 shared snapshots to bound the blob size.
      const snapshots = json.snapshots.slice(0, 20);
      const blob = await put(BLOB_PATH, JSON.stringify({ snapshots }), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
      });
      res.status(200).json({ ok: true, url: blob.url, count: snapshots.length });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
