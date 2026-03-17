const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Multer storage config
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      .slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm|mkv|pdf|zip)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('不支持的文件格式'));
  }
});

function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) return 'video';
  return 'other';
}

// GET /api/portfolio - public
router.get('/', (req, res) => {
  const type = req.query.type;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  let items, total;
  if (type && ['image', 'video', 'other'].includes(type)) {
    total = db.prepare('SELECT COUNT(*) as count FROM portfolio_items WHERE is_active = 1 AND media_type = ?').get(type).count;
    items = db.prepare('SELECT * FROM portfolio_items WHERE is_active = 1 AND media_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(type, limit, offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as count FROM portfolio_items WHERE is_active = 1').get().count;
    items = db.prepare('SELECT * FROM portfolio_items WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  }

  res.json({
    items: items.map(i => ({ ...i, tags: JSON.parse(i.tags || '[]') })),
    total, page, limit,
    hasMore: offset + items.length < total
  });
});

// GET /api/portfolio/all - admin
router.get('/all', authMiddleware, (req, res) => {
  const type = req.query.type;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  let items, total;
  if (type && ['image', 'video', 'other'].includes(type)) {
    total = db.prepare('SELECT COUNT(*) as count FROM portfolio_items WHERE media_type = ?').get(type).count;
    items = db.prepare('SELECT * FROM portfolio_items WHERE media_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(type, limit, offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as count FROM portfolio_items').get().count;
    items = db.prepare('SELECT * FROM portfolio_items ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  }

  res.json({
    items: items.map(i => ({ ...i, tags: JSON.parse(i.tags || '[]') })),
    total, page, limit
  });
});

// POST /api/portfolio/upload - admin
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const mediaType = getMediaType(req.file.filename);

  res.json({
    file_url: fileUrl,
    media_type: mediaType,
    original_name: req.file.originalname,
    size: req.file.size
  });
});

// POST /api/portfolio - admin
router.post('/', authMiddleware, (req, res) => {
  const { title, description, file_url, thumbnail_url, media_type, width, height, tags, is_active } = req.body;
  if (!title || !file_url) return res.status(400).json({ error: '标题和文件不能为空' });

  const autoMediaType = media_type || getMediaType(file_url);

  const result = db.prepare(`
    INSERT INTO portfolio_items (title, description, file_url, thumbnail_url, media_type, width, height, tags, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    file_url,
    thumbnail_url || '',
    autoMediaType,
    width || null,
    height || null,
    JSON.stringify(tags || []),
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  );

  const newItem = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newItem, tags: JSON.parse(newItem.tags || '[]') });
});

// PUT /api/portfolio/:id - admin
router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, file_url, thumbnail_url, media_type, width, height, tags, is_active } = req.body;
  const item = db.prepare('SELECT id FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '作品不存在' });

  db.prepare(`
    UPDATE portfolio_items
    SET title = ?, description = ?, file_url = ?, thumbnail_url = ?, media_type = ?, width = ?, height = ?, tags = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title,
    description || '',
    file_url,
    thumbnail_url || '',
    media_type,
    width || null,
    height || null,
    JSON.stringify(tags || []),
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
});

// DELETE /api/portfolio/:id - admin
router.delete('/:id', authMiddleware, (req, res) => {
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: '作品不存在' });

  if (item.file_url && item.file_url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../..', item.file_url);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
  }

  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
