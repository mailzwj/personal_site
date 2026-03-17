import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import './Portfolio.css'

const TABS = [
  { key: 'all', label: '全部', icon: '◈' },
  { key: 'image', label: '图像', icon: '◉' },
  { key: 'video', label: '视频', icon: '▶' },
  { key: 'other', label: '其他', icon: '◆' },
]

function MediaItem({ item, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const isVideo = item.media_type === 'video'

  return (
    <div
      className={`media-item${loaded ? ' loaded' : ''}`}
      onClick={() => onClick(item)}
    >
      <div className="media-inner">
        {!error && isVideo ? (
          <video
            src={item.file_url}
            preload="metadata"
            muted
            loop
            onLoadedMetadata={() => setLoaded(true)}
            onError={() => setError(true)}
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
          />
        ) : !error ? (
          <img
            src={item.file_url}
            alt={item.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true) }}
          />
        ) : (
          <div className="media-fallback">
            {item.media_type === 'video' ? '▶' : item.media_type === 'image' ? '◉' : '◆'}
          </div>
        )}

        <div className="media-overlay">
          <div className="media-info">
            <span className={`media-type-badge ${item.media_type}`}>
              {item.media_type === 'video' ? '▶ VIDEO' : item.media_type === 'image' ? '◉ IMAGE' : '◆ OTHER'}
            </span>
            <h4 className="media-title">{item.title}</h4>
            {item.description && <p className="media-desc">{item.description}</p>}
          </div>
          <div className="media-zoom-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </div>
        </div>
      </div>
      {!loaded && !error && <div className="media-skeleton" />}
    </div>
  )
}

function LightBox({ item, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!item) return null

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        {item.media_type === 'video' ? (
          <video
            src={item.file_url}
            controls
            autoPlay
            className="lightbox-media"
          />
        ) : item.media_type === 'image' ? (
          <img src={item.file_url} alt={item.title} className="lightbox-media" />
        ) : (
          <div className="lightbox-other">
            <div className="other-icon">◆</div>
            <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              查看文件
            </a>
          </div>
        )}
        <div className="lightbox-info">
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
          <div className="lightbox-tags">
            {(item.tags || []).map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple masonry layout using CSS columns
function MasonryGrid({ items, onItemClick }) {
  return (
    <div className="masonry-grid">
      {items.map((item, i) => (
        <div key={item.id} className="masonry-item" style={{ '--delay': `${(i % 12) * 0.04}s` }}>
          <MediaItem item={item} onClick={onItemClick} />
        </div>
      ))}
    </div>
  )
}

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [lightboxItem, setLightboxItem] = useState(null)
  const sentinelRef = useRef(null)

  const fetchItems = useCallback(async (tab, pageNum) => {
    setLoading(true)
    try {
      const typeParam = tab === 'all' ? '' : `&type=${tab}`
      const res = await axios.get(`/api/portfolio?page=${pageNum}&limit=24${typeParam}`)
      const { items: newItems, hasMore: more } = res.data
      setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems])
      setHasMore(more)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    setItems([])
    fetchItems(activeTab, 1)
  }, [activeTab])

  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const next = page + 1
        setPage(next)
        fetchItems(activeTab, next)
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, activeTab])

  return (
    <main className="portfolio-page page-enter">
      {/* Hero */}
      <div className="portfolio-hero">
        <div className="portfolio-hero-bg" />
        <div className="container">
          <p className="section-label">// WORKS</p>
          <h1 className="section-title">AI 创作作品集</h1>
          <p className="portfolio-hero-sub">AI 生成的图像与视频艺术，探索人工智能的创作边界</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="portfolio-tabs-wrapper">
        <div className="container">
          <div className="portfolio-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        {loading && items.length === 0 ? (
          <div className="portfolio-loading">
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="portfolio-empty">
            <div className="empty-icon">◈</div>
            <p>该分类暂无作品</p>
          </div>
        ) : (
          <>
            <MasonryGrid items={items} onItemClick={setLightboxItem} />
            <div ref={sentinelRef} className="portfolio-sentinel">
              {loading && <div className="spinner" style={{ margin: '0 auto' }} />}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <LightBox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </main>
  )
}
