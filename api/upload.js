export const config = {
  api: {
    bodyParser: false
  }
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });

    try {
      const file = files.file;
      const fileStream = require('fs').createReadStream(file.filepath);

      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', fileStream);

      const uploadRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: fd
      });

      const url = await uploadRes.text();

      res.status(200).json({ url });
    } catch (e) {
      res.status(500).json({ error: 'Upload gagal' });
    }
  });
    }
