// Serverless function: LIVE camera/accessory photo lookup from the shared Google Drive folder.
//   GET /api/camera-image?model=AVC-NXB81F28  -> { url: "<public blob url>" } | { url: null, reason }
//
// The Drive folder (PARENT) holds one sub-folder per model (named exactly by model), each containing
// the product image (e.g. "AVC-NXB81F28.png"). This endpoint finds that sub-folder, downloads the
// image, caches it in Vercel Blob under a stable per-model path, and returns the public URL. Pressing
// "Load from Google Drive" therefore always reflects the CURRENT Drive contents (newly added photos
// included), unlike the static camera_images.json snapshot.
//
// Requires BLOB_READ_WRITE_TOKEN (injected once a Blob store is connected to the project).
const { put } = require('@vercel/blob');

const PARENT = '1US7wDcUh5MzIJUTDm6I3g3-bgNMWm8XU';
const UA = { 'User-Agent': 'Mozilla/5.0' };

async function driveList(folderId) {
  const r = await fetch('https://drive.google.com/embeddedfolderview?id=' + folderId + '#list', { headers: UA });
  if (!r.ok) return [];
  const html = await r.text();
  const out = [];
  const parts = html.split('<div class="flip-entry"');
  for (let i = 1; i < parts.length; i++) {
    const ch = parts[i];
    const m = ch.match(/^\s*id="entry-([0-9A-Za-z_-]{15,})"/);
    const t = ch.match(/flip-entry-title">([^<]+)</);
    if (m && t) out.push({ name: t[1].trim(), id: m[1] });
  }
  return out;
}

const norm = (s) => String(s || '').toUpperCase().replace(/[\s_]+/g, '');

module.exports = async (req, res) => {
  let model = '';
  try { model = String((req.query && req.query.model) || '').trim(); } catch (e) { model = ''; }
  if (!model) {
    try { const u = new URL(req.url, 'http://x'); model = String(u.searchParams.get('model') || '').trim(); } catch (e) {}
  }
  if (!model) { res.status(400).json({ error: 'model query param required' }); return; }
  try {
    // 1) locate the model's sub-folder in the shared Drive folder
    const top = await driveList(PARENT);
    const um = norm(model);
    const folder = top.find(e => norm(e.name) === um) || top.find(e => norm(e.name).indexOf(um) === 0);
    if (!folder) { res.status(200).json({ url: null, reason: 'no matching Drive folder' }); return; }

    // 2) pick the best image inside it (skip dimension/datasheet assets; prefer 1000x1000, then exact name)
    const files = await driveList(folder.id);
    const imgs = files.filter(f => /\.(png|jpe?g)$/i.test(f.name) && !/dimension|datasheet|spec/i.test(f.name));
    if (!imgs.length) { res.status(200).json({ url: null, reason: 'no image in Drive folder' }); return; }
    const pick = imgs.find(f => /1000x1000/i.test(f.name))
      || imgs.find(f => norm(f.name.replace(/\.(png|jpe?g)$/i, '')) === um)
      || imgs[0];

    // 3) download the image bytes from Drive
    const dl = await fetch('https://drive.google.com/uc?export=view&id=' + pick.id, { headers: UA });
    if (!dl.ok) { res.status(200).json({ url: null, reason: 'Drive download failed (' + dl.status + ')' }); return; }
    const ct0 = String(dl.headers.get('content-type') || '');
    const buf = Buffer.from(await dl.arrayBuffer());
    const isJpg = /jpe?g/i.test(ct0) || /\.jpe?g$/i.test(pick.name);
    const png = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50;
    const jpg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8;
    if (!png && !jpg) { res.status(200).json({ url: null, reason: 'Drive returned a non-image response' }); return; }
    const contentType = jpg ? 'image/jpeg' : 'image/png';
    const ext = jpg ? '.jpg' : '.png';

    // 4) cache in Vercel Blob under a stable per-model path (re-fetch overwrites with the latest)
    if (!process.env.BLOB_READ_WRITE_TOKEN) { res.status(200).json({ url: null, reason: 'Blob store not configured' }); return; }
    const safe = model.replace(/[^A-Za-z0-9._-]/g, '_');
    const blob = await put('accessory-camera/' + safe + ext, buf, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    res.status(200).json({ url: blob.url, name: pick.name, model });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
