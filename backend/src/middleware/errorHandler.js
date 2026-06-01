export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.http_code === 401 || err.message?.includes('Invalid Signature')) {
    return res.status(502).json({
      message:
        'Cloudinary upload failed: invalid credentials. Copy CLOUDINARY_URL from your Cloudinary Dashboard → API Keys, or verify API Key + API Secret match the same account.',
    });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate ${field}. This already exists.` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
}
