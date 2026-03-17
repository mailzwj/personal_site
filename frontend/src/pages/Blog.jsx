import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Blog.css'

function BlogCard({ post, index }) {
  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="blog-card glass-card"
      style={{ '--delay': `${(index % 20) * 0.05}s` }}
    >
      <div className="blog-card-inner">
        <div className="blog-meta-top">
          <span className="blog-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {date}
          </span>
          <span className="blog-views">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {post.view_count || 0}
          </span>
        </div>

        <h2 className="blog-title">{post.title}</h2>
        <p className="blog-excerpt">{post.excerpt}</p>

        <div className="blog-footer">
          <div className="blog-tags">
            {(post.tags || []).slice(0, 3).map((tag, i) => (
              <span key={i} className={`tag ${i % 3 === 1 ? 'violet' : i % 3 === 2 ? 'pink' : ''}`}>{tag}</span>
            ))}
          </div>
          <span className="blog-read-more">
            阅读全文
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const observerRef = React.useRef(null)
  const sentinelRef = React.useRef(null)

  const fetchPosts = useCallback(async (pageNum) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await axios.get(`/api/blogs?page=${pageNum}&limit=20`)
      const { posts: newPosts, hasMore: more } = res.data
      setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts])
      setHasMore(more)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [loading])

  useEffect(() => {
    fetchPosts(1)
  }, [])

  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(nextPage)
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    observerRef.current = observer
    return () => observer.disconnect()
  }, [hasMore, loading, page])

  return (
    <main className="blog-page page-enter">
      <div className="blog-hero">
        <div className="blog-hero-bg" />
        <div className="container">
          <p className="section-label">// BLOG</p>
          <h1 className="section-title">AI 技术博客</h1>
          <p className="blog-hero-sub">深度解析 AI 技术趋势，分享实践心得与洞察思考</p>
        </div>
      </div>

      <div className="container">
        {initialLoading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>暂无文章，敬请期待</p>
          </div>
        ) : (
          <>
            <div className="blog-grid">
              {posts.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="scroll-sentinel">
              {loading && <div className="spinner" style={{ margin: '0 auto' }} />}
              {!hasMore && posts.length > 0 && (
                <p className="end-msg">
                  <span className="tag">已加载全部文章</span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
