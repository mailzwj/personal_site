const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: '旧密码错误' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin_users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
    .run(newHash, user.id);

  res.json({ message: '密码修改成功' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

module.exports = router;
