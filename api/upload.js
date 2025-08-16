// api/upload.js
const formidable = require('formidable');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch'); // node-fetch v2 for CommonJS

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    maxFileSize: 200 * 1024 * 1024 // 200MB limit (sesuaikan jika perlu)
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('form parse error', err);
      return res.status(400).json({ error: 'Gagal memproses file', detail: String(err) });
    }

    // field name is 'file' from frontend
    const f = files.file;
    if (!f) {
      return res.status(400).json({ error: 'File tidak ditemukan di request' });
    }

    try {
      const stream = fs.createReadStream(f.filepath || f.path);
      const fd = new FormData();
      // Catbox expects field name 'fileToUpload' and reqtype=fileupload
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', stream, { filename: f.originalFilename || f.newFilename || 'upload.bin' });

      // Catbox endpoint
      const upstream = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: fd.getHeaders(),
        body: fd
      });

      const text = await upstream.text(); // catbox returns direct URL in plain text on success
      if (!upstream.ok) {
        return res.status(502).json({ error: 'Upstream error', status: upstream.status, body: text });
      }

      // text usually url (e.g. https://files.catbox.moe/xxxxx)
      // Return JSON so frontend can parse
      return res.status(200).json({ status: 200, url: text.trim(), raw: text.trim() });

    } catch (e) {
      console.error('upload forward error', e);
      return res.status(502).json({ error: 'Gagal mengupload ke Catbox', detail: String(e) });
    } finally {
      // cleanup temp file if exists
      try { if (f && (f.filepath || f.path)) fs.unlinkSync(f.filepath || f.path); } catch(e){}
    }
  });
};
