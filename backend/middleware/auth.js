const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meet-ai-home-secret-key-2025';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期，请重新登录' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
