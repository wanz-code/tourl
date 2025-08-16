// api/upload.js
const formidable = require('formidable');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Allow CORS from anywhere (you can lock this to your domain later)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed, use POST' });
    return;
  }

  const form = new formidable.IncomingForm({ multiples: false });
  // Increase upload size if needed. Default is typically OK but can be changed:
  // form.maxFileSize = 200 * 1024 * 1024; // 200MB

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error('formidable parse error:', err);
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }

      // Expect file input name "file"
      const file = files.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded (field name must be "file")' });
        return;
      }

      // file.path contains temporary path. We'll stream it to Catbox.
      const fileStream = fs.createReadStream(file.path);

      // Build form-data for Catbox
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      // If you have a userhash, add it: fd.append('userhash', 'YOUR_USERHASH');
      fd.append('fileToUpload', fileStream, {
        filename: file.name || 'upload.bin',
        contentType: file.type || 'application/octet-stream'
      });

      // Post to Catbox
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: fd.getHeaders(),
        body: fd
      });

      const text = await response.text();

      // Catbox returns a direct URL as plain text on success
      if (!response.ok) {
        console.error('Catbox API error:', response.status, text);
        res.status(502).json({ error: 'Catbox API error', status: response.status, body: text });
        return;
      }

      // Return link to frontend
      res.status(200).json({ url: text.trim() });

      // cleanup temp file (formidable stores temp file)
      try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

    } catch (e) {
      console.error('Unexpected error in upload proxy:', e);
      res.status(500).json({ error: 'Server error' });
    }
  });
};
