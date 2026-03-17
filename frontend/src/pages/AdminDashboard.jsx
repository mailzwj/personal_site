import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import './AdminDashboard.css'

/* ────────────────── Shared helpers ────────────────── */
function TagInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !value.includes(t)) { onChange([...value, t]); setInput('') }
  }
  const remove = tag => onChange(value.filter(t => t !== tag))
  return (
    <div className="tag-input">
      <div className="tag-input-tags">
        {value.map(t => (
          <span key={t} className="tag-chip">
            {t}
            <button type="button" onClick={() => remove(t)}>×</button>
          </span>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          type="text"
          className="form-input"
          placeholder="输入标签，按 Enter 添加"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn btn-ghost" onClick={add} style={{whiteSpace:'nowrap'}}>添加</button>
      </div>
    </div>
  )
}

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function ConfirmModal({ open, onClose, onConfirm, message }) {
  return (
    <Modal open={open} onClose={onClose} title="确认操作">
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>取消</button>
        <button className="btn btn-danger" onClick={onConfirm}>确认删除</button>
      </div>
    </Modal>
  )
}

/* ────────────────── Admin Layout ────────────────── */
const ADMIN_NAV = [
  { path: '/admin', label: 'AI 项目', icon: '◈', exact: true },
  { path: '/admin/blogs', label: '博客文章', icon: '📝' },
  { path: '/admin/portfolio', label: '作品集', icon: '◉' },
  { path: '/admin/settings', label: '账号设置', icon: '⚙' },
]

function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <Link to="/" className="admin-site-logo">
            <span style={{ color: 'var(--cyan)' }}>[</span>MEET<span style={{ color: 'var(--cyan)' }}>·AI</span><span style={{ color: 'var(--cyan)' }}>]</span>
          </Link>
          <span className="admin-badge">ADMIN</span>
        </div>

        <nav className="admin-nav">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item${isActive(item.path, item.exact) ? ' active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user">
            <div className="user-avatar">
              {(user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.username}</span>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            退出
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}

/* ────────────────── AI Projects ────────────────── */
function ProjectsAdmin() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ name:'', website:'', description:'', logo_url:'', tags:[], rank:0, is_active:true })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => {
    setLoading(true)
    axios.get('/api/projects/all')
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name:'', website:'', description:'', logo_url:'', tags:[], rank:0, is_active:true })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditItem(p)
    setForm({ name:p.name, website:p.website||'', description:p.description||'', logo_url:p.logo_url||'', tags:p.tags||[], rank:p.rank||0, is_active:!!p.is_active })
    setModalOpen(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await axios.put(`/api/projects/${editItem.id}`, form)
      } else {
        await axios.post('/api/projects', form)
      }
      setModalOpen(false)
      load()
      showMsg('success', editItem ? '更新成功' : '创建成功')
    } catch (err) {
      showMsg('error', err.response?.data?.error || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/projects/${confirmId}`)
      setConfirmId(null)
      load()
      showMsg('success', '删除成功')
    } catch (err) {
      showMsg('error', '删除失败')
    }
  }

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">AI 项目管理</h2>
          <p className="admin-section-sub">管理首页展示的热门 AI 项目</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ 新增项目</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>排序</th><th>名称</th><th>官网</th><th>状态</th><th>标签</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td><span className="rank-badge">#{p.rank}</span></td>
                  <td>
                    <div className="table-name-cell">
                      {p.logo_url && <img src={p.logo_url} alt="" className="table-logo" onError={e=>{e.target.style.display='none'}} />}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td><a href={p.website} target="_blank" rel="noopener noreferrer" className="table-link">{p.website?.replace(/^https?:\/\//, '').slice(0,30)}</a></td>
                  <td><span className={`status-badge ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? '显示' : '隐藏'}</span></td>
                  <td>
                    <div className="table-tags">
                      {(p.tags||[]).slice(0,2).map((t,i)=><span key={i} className="tag" style={{fontSize:10}}>{t}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑项目' : '新增项目'}>
        <form onSubmit={handleSave} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">项目名称 *</label>
              <input className="form-input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">排序权重</label>
              <input type="number" className="form-input" value={form.rank} onChange={e=>setForm(p=>({...p,rank:parseInt(e.target.value)||0}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">官网 URL</label>
            <input className="form-input" placeholder="https://" value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input className="form-input" placeholder="https://..." value={form.logo_url} onChange={e=>setForm(p=>({...p,logo_url:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">描述</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">标签</label>
            <TagInput value={form.tags} onChange={v=>setForm(p=>({...p,tags:v}))} />
          </div>
          <div className="form-group">
            <label className="form-label toggle-label">
              <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} />
              <span>在首页展示</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        message="确定要删除该项目吗？此操作不可恢复。"
      />
    </div>
  )
}

/* ────────────────── Blog Admin ────────────────── */
function BlogsAdmin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ title:'', content:'', tags:[], status:'published' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = (p=1) => {
    setLoading(true)
    axios.get(`/api/blogs/all?page=${p}&limit=20`)
      .then(res => { setPosts(res.data.posts); setTotal(res.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const openCreate = () => {
    setEditItem(null)
    setForm({ title:'', content:'# 文章标题\n\n开始写作...', tags:[], status:'published' })
    setIsEditorOpen(true)
  }

  const openEdit = (p) => {
    setEditItem(p)
    // Load full content
    axios.get(`/api/blogs/id/${p.id}`).then(res => {
      setForm({ title:res.data.title, content:res.data.content, tags:res.data.tags||[], status:res.data.status||'published' })
      setIsEditorOpen(true)
    })
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await axios.put(`/api/blogs/${editItem.id}`, form)
      } else {
        await axios.post('/api/blogs', form)
      }
      setIsEditorOpen(false)
      load(page)
      showMsg('success', editItem ? '更新成功' : '发布成功')
    } catch (err) {
      showMsg('error', err.response?.data?.error || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/blogs/${confirmId}`)
      setConfirmId(null)
      load(page)
      showMsg('success', '删除成功')
    } catch { showMsg('error', '删除失败') }
  }

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  if (isEditorOpen) {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">{editItem ? '编辑文章' : '新增文章'}</h2>
            <p className="admin-section-sub">支持 Markdown 格式</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setIsEditorOpen(false)}>← 返回列表</button>
        </div>

        <form onSubmit={handleSave} className="blog-editor">
          <div className="blog-editor-top">
            <input
              className="form-input blog-title-input"
              placeholder="文章标题"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
            <div className="blog-editor-actions">
              <select
                className="form-select"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: 120 }}
              >
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '保存中...' : '发布文章'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">标签</label>
            <TagInput value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />
          </div>

          <div className="blog-editor-pane">
            <div className="editor-pane-header">
              <span className="form-label">MARKDOWN 内容</span>
              <span className="editor-hint">支持完整 Markdown 语法</span>
            </div>
            <textarea
              className="form-textarea blog-markdown-area"
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="在这里用 Markdown 写作..."
              rows={30}
            />
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">博客文章管理</h2>
          <p className="admin-section-sub">共 {total} 篇文章</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ 新增文章</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>标题</th><th>状态</th><th>阅读量</th><th>标签</th><th>发布时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-title-cell">{p.title}</div>
                    <div className="table-excerpt">{p.excerpt?.slice(0,60)}...</div>
                  </td>
                  <td><span className={`status-badge ${p.status === 'published' ? 'active' : 'inactive'}`}>{p.status === 'published' ? '已发布' : '草稿'}</span></td>
                  <td>{p.view_count}</td>
                  <td>
                    <div className="table-tags">
                      {(p.tags||[]).slice(0,2).map((t,i)=><span key={i} className="tag" style={{fontSize:10}}>{t}</span>)}
                    </div>
                  </td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text-muted)'}}>{p.created_at?.slice(0,10)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > 20 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← 上一页</button>
              <span className="page-info">{page} / {Math.ceil(total / 20)}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>下一页 →</button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} message="确定要删除该文章吗？此操作不可恢复。" />
    </div>
  )
}

/* ────────────────── Portfolio Admin ────────────────── */
function PortfolioAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ title:'', description:'', file_url:'', thumbnail_url:'', media_type:'image', tags:[], is_active:true })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [activeType, setActiveType] = useState('all')
  const fileRef = useRef(null)

  const load = () => {
    setLoading(true)
    const typeParam = activeType === 'all' ? '' : `&type=${activeType}`
    axios.get(`/api/portfolio/all?limit=50${typeParam}`)
      .then(res => setItems(res.data.items))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeType])

  const openCreate = () => {
    setEditItem(null)
    setForm({ title:'', description:'', file_url:'', thumbnail_url:'', media_type:'image', tags:[], is_active:true })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ title:item.title, description:item.description||'', file_url:item.file_url, thumbnail_url:item.thumbnail_url||'', media_type:item.media_type, tags:item.tags||[], is_active:!!item.is_active })
    setModalOpen(true)
  }

  const handleUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post('/api/portfolio/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(p => ({
        ...p,
        file_url: res.data.file_url,
        media_type: res.data.media_type,
        title: p.title || file.name.replace(/\.[^.]+$/, '')
      }))
    } catch (err) {
      showMsg('error', err.response?.data?.error || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await axios.put(`/api/portfolio/${editItem.id}`, form)
      } else {
        await axios.post('/api/portfolio', form)
      }
      setModalOpen(false)
      load()
      showMsg('success', editItem ? '更新成功' : '添加成功')
    } catch (err) {
      showMsg('error', err.response?.data?.error || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/portfolio/${confirmId}`)
      setConfirmId(null)
      load()
      showMsg('success', '删除成功')
    } catch { showMsg('error', '删除失败') }
  }

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const TYPES = [
    { key: 'all', label: '全部' },
    { key: 'image', label: '图像' },
    { key: 'video', label: '视频' },
    { key: 'other', label: '其他' },
  ]

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">作品集管理</h2>
          <p className="admin-section-sub">上传和管理 AI 创作作品</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ 新增作品</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="portfolio-type-tabs">
        {TYPES.map(t => (
          <button
            key={t.key}
            className={`tab-btn-sm${activeType === t.key ? ' active' : ''}`}
            onClick={() => setActiveType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : items.length === 0 ? (
        <div className="admin-empty">暂无作品，点击「新增作品」上传</div>
      ) : (
        <div className="portfolio-admin-grid">
          {items.map(item => (
            <div key={item.id} className={`portfolio-admin-item${!item.is_active ? ' inactive' : ''}`}>
              <div className="portfolio-item-preview">
                {item.media_type === 'video' ? (
                  <video src={item.file_url} preload="metadata" muted />
                ) : item.media_type === 'image' ? (
                  <img src={item.file_url} alt={item.title} onError={e => { e.target.style.display='none' }} />
                ) : (
                  <div className="other-preview-icon">◆</div>
                )}
                <span className={`item-type-badge ${item.media_type}`}>
                  {item.media_type === 'video' ? '▶' : item.media_type === 'image' ? '◉' : '◆'}
                </span>
              </div>
              <div className="portfolio-item-info">
                <p className="portfolio-item-title">{item.title}</p>
                <div className="table-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>编辑</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(item.id)}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑作品' : '新增作品'}>
        <form onSubmit={handleSave} className="admin-form">
          {/* File upload */}
          <div className="upload-area" onClick={() => fileRef.current?.click()}>
            {form.file_url ? (
              <div className="upload-preview">
                {form.media_type === 'video'
                  ? <video src={form.file_url} preload="metadata" muted style={{ maxHeight:120 }} />
                  : form.media_type === 'image'
                    ? <img src={form.file_url} alt="" style={{ maxHeight:120, objectFit:'contain' }} />
                    : <div className="upload-icon">◆</div>
                }
                <span className="upload-change">点击更换文件</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                {uploading ? (
                  <><div className="spinner" /><span>上传中...</span></>
                ) : (
                  <>
                    <div className="upload-icon-big">↑</div>
                    <span>点击上传文件</span>
                    <span className="upload-hint">支持图片、视频等格式，最大 200MB</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" style={{ display:'none' }} onChange={handleUpload} accept="image/*,video/*,.pdf,.zip" />

          <div className="form-group">
            <label className="form-label">标题 *</label>
            <input className="form-input" required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">描述</label>
            <textarea className="form-textarea" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">文件 URL *</label>
              <input className="form-input" required value={form.file_url} onChange={e=>setForm(p=>({...p,file_url:e.target.value}))} placeholder="/uploads/..." />
            </div>
            <div className="form-group">
              <label className="form-label">媒体类型</label>
              <select className="form-select" value={form.media_type} onChange={e=>setForm(p=>({...p,media_type:e.target.value}))}>
                <option value="image">图像</option>
                <option value="video">视频</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">标签</label>
            <TagInput value={form.tags} onChange={v=>setForm(p=>({...p,tags:v}))} />
          </div>
          <div className="form-group">
            <label className="form-label toggle-label">
              <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} />
              <span>在作品集展示</span>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={()=>setModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={saving||uploading}>{saving ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} message="确定要删除该作品吗？文件也会一并删除。" />
    </div>
  )
}

/* ────────────────── Settings ────────────────── */
function SettingsAdmin() {
  const { user } = useAuth()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await axios.post('/api/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
      setMsg({ type: 'success', text: '密码修改成功！' })
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || '修改失败' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">账号设置</h2>
          <p className="admin-section-sub">管理你的管理员账号</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card glass-card">
          <h3 className="settings-card-title">账号信息</h3>
          <div className="settings-user-info">
            <div className="settings-avatar">
              {(user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="settings-username">{user?.username}</p>
              <p className="settings-role">管理员</p>
            </div>
          </div>
        </div>

        <div className="settings-card glass-card">
          <h3 className="settings-card-title">修改密码</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <div className="form-group">
              <label className="form-label">当前密码</label>
              <input type="password" className="form-input" required value={form.oldPassword} onChange={e=>setForm(p=>({...p,oldPassword:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">新密码 (至少6位)</label>
              <input type="password" className="form-input" required minLength={6} value={form.newPassword} onChange={e=>setForm(p=>({...p,newPassword:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input type="password" className="form-input" required value={form.confirmPassword} onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ────────────────── Main Export ────────────────── */
export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<ProjectsAdmin />} />
        <Route path="blogs" element={<BlogsAdmin />} />
        <Route path="portfolio" element={<PortfolioAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Routes>
    </AdminLayout>
  )
}
