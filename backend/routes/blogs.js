const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') +
    '-' + Date.now();
}

// GET /api/blogs - public, paginated
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const total = db.prepare("SELECT COUNT(*) as count FROM blog_posts WHERE status = 'published'").get().count;
  const posts = db.prepare(`
    SELECT id, title, slug, excerpt, cover_image, tags, view_count, created_at, updated_at
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({
    posts: posts.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })),
    total,
    page,
    limit,
    hasMore: offset + posts.length < total
  });
});

// GET /api/blogs/all - admin
router.get('/all', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count;
  const posts = db.prepare(`
    SELECT id, title, slug, excerpt, cover_image, tags, status, view_count, created_at, updated_at
    FROM blog_posts
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({
    posts: posts.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })),
    total,
    page,
    limit,
    hasMore: offset + posts.length < total
  });
});

// GET /api/blogs/id/:id - admin (must be BEFORE /:slug)
router.get('/id/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  res.json({ ...post, tags: JSON.parse(post.tags || '[]') });
});

// GET /api/blogs/:slug - public
router.get('/:slug', (req, res) => {
  const post = db.prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'").get(req.params.slug);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  db.prepare('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?').run(post.id);

  res.json({ ...post, tags: JSON.parse(post.tags || '[]') });
});

// POST /api/blogs - admin
router.post('/', authMiddleware, (req, res) => {
  const { title, content, excerpt, cover_image, tags, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });

  const slug = generateSlug(title);
  const autoExcerpt = excerpt || content.replace(/[#*\[\]`]/g, '').slice(0, 150) + '...';

  const result = db.prepare(`
    INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    slug,
    content,
    autoExcerpt,
    cover_image || '',
    JSON.stringify(tags || []),
    status || 'published'
  );

  const newPost = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newPost, tags: JSON.parse(newPost.tags || '[]') });
});

// PUT /api/blogs/:id - admin
router.put('/:id', authMiddleware, (req, res) => {
  const { title, content, excerpt, cover_image, tags, status } = req.body;
  const post = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const autoExcerpt = excerpt || (content ? content.replace(/[#*\[\]`]/g, '').slice(0, 150) + '...' : '');

  db.prepare(`
    UPDATE blog_posts
    SET title = ?, content = ?, excerpt = ?, cover_image = ?, tags = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title,
    content,
    autoExcerpt,
    cover_image || '',
    JSON.stringify(tags || []),
    status || 'published',
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
});

// DELETE /api/blogs/:id - admin
router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
