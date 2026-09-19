export function errorHandler(err, _req, res, _next) {
  // Always log full error details server-side
  console.error(err);

  const isProduction = process.env.NODE_ENV === 'production';

  if (err.http_code === 401 || err.message?.includes('Invalid Signature')) {
    return res.status(502).json({
      message: isProduction
        ? 'Media upload service error. Please try again later.'
        : 'Cloudinary upload failed: invalid credentials. Copy CLOUDINARY_URL from your Cloudinary Dashboard → API Keys, or verify API Key + API Secret match the same account.',
    });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Forbidden: Origin not allowed by CORS' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate ${field}. This already exists.` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  // In production, never expose internal error details to client
  const status = err.status || 500;
  const message = isProduction && status === 500
    ? 'An unexpected error occurred. Please try again later.'
    : (err.message || 'Internal server error');

  res.status(status).json({ message });
}
