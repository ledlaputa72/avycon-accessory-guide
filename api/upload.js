// Serverless function: upload an image to Vercel Blob and return its public URL.
// The browser POSTs raw image bytes (Content-Type: image/...) to /api/upload?filename=foo.jpg
// Requires the BLOB_READ_WRITE_TOKEN env var, which Vercel injects automatically once a
// Blob store is connected to the project (Storage tab -> Create / Connect Blob store).
const { put } = require('@vercel/blob');

// Read the raw request body as a Buffer, whether Vercel pre-parsed it or left it as a stream.
async function readRawBody(req) {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: 'Blob store not configured (missing BLOB_READ_WRITE_TOKEN)' });
    return;
  }
  try {
    const raw = (req.query && req.query.filename) ? String(req.query.filename) : 'image.jpg';
    const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'image.jpg';
    const contentType = req.headers['content-type'] || 'image/jpeg';

    const buffer = await readRawBody(req);
    if (!buffer || !buffer.length) {
      res.status(400).json({ error: 'Empty body' });
      return;
    }

    const blob = await put('accessory-images/' + safe, buffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: true,
    });

    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
