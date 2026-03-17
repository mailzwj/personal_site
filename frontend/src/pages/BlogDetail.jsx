import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './BlogDetail.css'

export default function BlogDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    axios.get(`/api/blogs/${slug}`)
      .then(res => setPost(res.data))
      .catch(err => {
        if (err.response?.status === 404) setError('文章不存在')
        else setError('加载失败，请重试')
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="blog-detail-loading">
      <div className="spinner" />
    </div>
  )

  if (error) return (
    <div className="blog-detail-error page-enter">
      <div className="container">
        <div className="error-content">
          <span className="error-code">404</span>
          <h2>{error}</h2>
          <Link to="/blog" className="btn btn-ghost">← 返回博客</Link>
        </div>
      </div>
    </div>
  )

  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <main className="blog-detail page-enter">
      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-hero-bg" />
        <div className="container">
          <nav className="detail-breadcrumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <Link to="/blog">博客</Link>
            <span>/</span>
            <span className="active">{post.title}</span>
          </nav>

          <div className="detail-tags">
            {(post.tags || []).map((tag, i) => (
              <span key={i} className={`tag ${i % 2 === 0 ? '' : 'violet'}`}>{tag}</span>
            ))}
          </div>

          <h1 className="detail-title">{post.title}</h1>

          <div className="detail-meta">
            <span className="detail-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {date}
            </span>
            <span className="detail-views">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {post.view_count} 次阅读
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        <div className="detail-layout">
          <article className="detail-content">
            <div className="gradient-line" style={{ marginBottom: '48px' }} />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown-body"
            >
              {post.content}
            </ReactMarkdown>
            <div className="gradient-line" style={{ marginTop: '48px' }} />
          </article>

          {/* Sidebar */}
          <aside className="detail-sidebar">
            <div className="sidebar-card glass-card">
              <h4 className="sidebar-title">关于文章</h4>
              <div className="sidebar-item">
                <span className="sidebar-label">发布时间</span>
                <span className="sidebar-value">{date}</span>
              </div>
              <div className="sidebar-item">
                <span className="sidebar-label">阅读量</span>
                <span className="sidebar-value">{post.view_count}</span>
              </div>
              {(post.tags || []).length > 0 && (
                <div className="sidebar-item flex-col">
                  <span className="sidebar-label">标签</span>
                  <div className="sidebar-tags">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/blog" className="btn btn-ghost back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回博客列表
            </Link>
          </aside>
        </div>
      </div>
    </main>
  )
}
