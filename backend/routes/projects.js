const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - public
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT * FROM ai_projects
    WHERE is_active = 1
    ORDER BY rank ASC, created_at DESC
  `).all();

  const parsed = projects.map(p => ({
    ...p,
    tags: JSON.parse(p.tags || '[]')
  }));

  res.json(parsed);
});

// GET /api/projects/all - admin
router.get('/all', authMiddleware, (req, res) => {
  const projects = db.prepare('SELECT * FROM ai_projects ORDER BY rank ASC, created_at DESC').all();
  res.json(projects.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })));
});

// GET /api/projects/:id - admin
router.get('/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM ai_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json({ ...project, tags: JSON.parse(project.tags || '[]') });
});

// POST /api/projects - admin
router.post('/', authMiddleware, (req, res) => {
  const { name, website, description, logo_url, tags, rank, is_active } = req.body;
  if (!name) return res.status(400).json({ error: '项目名称不能为空' });

  const result = db.prepare(`
    INSERT INTO ai_projects (name, website, description, logo_url, tags, rank, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    website || '',
    description || '',
    logo_url || '',
    JSON.stringify(tags || []),
    rank || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  );

  const newProject = db.prepare('SELECT * FROM ai_projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newProject, tags: JSON.parse(newProject.tags || '[]') });
});

// PUT /api/projects/:id - admin
router.put('/:id', authMiddleware, (req, res) => {
  const { name, website, description, logo_url, tags, rank, is_active } = req.body;
  const project = db.prepare('SELECT id FROM ai_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  db.prepare(`
    UPDATE ai_projects
    SET name = ?, website = ?, description = ?, logo_url = ?, tags = ?, rank = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name,
    website || '',
    description || '',
    logo_url || '',
    JSON.stringify(tags || []),
    rank || 0,
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM ai_projects WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
});

// DELETE /api/projects/:id - admin
router.delete('/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT id FROM ai_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  db.prepare('DELETE FROM ai_projects WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
