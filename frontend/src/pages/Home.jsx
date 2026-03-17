import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Home.css'

function ProjectCard({ project, index }) {
  const [imgError, setImgError] = useState(false)

  return (
    <a
      href={project.website}
      target="_blank"
      rel="noopener noreferrer"
      className="project-card glass-card"
      style={{ '--delay': `${index * 0.1}s` }}
    >
      <div className="project-rank">
        <span className="rank-num">{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="project-header">
        <div className="project-logo">
          {!imgError && project.logo_url ? (
            <img
              src={project.logo_url}
              alt={project.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="logo-fallback">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="project-meta">
          <h3 className="project-name">{project.name}</h3>
          <span className="project-url">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {project.website?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </span>
        </div>
      </div>

      <p className="project-desc">{project.description}</p>

      <div className="project-tags">
        {(project.tags || []).slice(0, 3).map((tag, i) => (
          <span key={i} className={`tag ${i % 2 === 0 ? '' : 'violet'}`}>{tag}</span>
        ))}
      </div>

      <div className="project-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </div>
    </a>
  )
}

function HeroParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.r = Math.random() * 1.5 + 0.5
        this.opacity = Math.random() * 0.4 + 0.1
        this.color = Math.random() > 0.5 ? '0,245,212' : '124,58,237'
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset()
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color},${this.opacity})`
        ctx.fill()
      }
    }

    particles = Array.from({ length: 80 }, () => new Particle())

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,245,212,${(1 - dist / 100) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-canvas" />
}

export default function Home() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/projects')
      .then(res => setProjects(res.data.slice(0, 5)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="home page-enter">
      {/* Hero */}
      <section className="hero">
        <HeroParticles />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>探索 AI 前沿世界</span>
          </div>
          <h1 className="hero-title">
            <span className="hero-line">Meet the</span>
            <span className="hero-line hero-accent">Future of AI</span>
          </h1>
          <p className="hero-sub">
            汇聚全球最热门的 AI 项目，探索人工智能的无限可能
            <br />
            <span className="hero-sub-dim">博客 · 作品 · 灵感</span>
          </p>
          <div className="hero-cta">
            <Link to="/portfolio" className="btn btn-primary">
              浏览作品集
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </Link>
            <Link to="/blog" className="btn btn-ghost">
              阅读博客
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">5</span>
              <span className="stat-label">TOP AI 项目</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">∞</span>
              <span className="stat-label">创作可能</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">2025</span>
              <span className="stat-label">AI 元年</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span>SCROLL</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* AI Projects Section */}
      <section className="projects-section">
        <div className="container">
          <div className="section-header">
            <p className="section-label">// TOP PICKS</p>
            <h2 className="section-title">全网热门 AI 项目</h2>
            <p className="section-desc">精选当下最值得关注的 AI 产品与工具</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-grid">
            <Link to="/blog" className="cta-card glass-card">
              <div className="cta-icon blog-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3>AI 技术博客</h3>
                <p>深度解析 AI 技术趋势，分享实践经验与洞察</p>
              </div>
              <div className="cta-arrow">→</div>
            </Link>

            <Link to="/portfolio" className="cta-card glass-card">
              <div className="cta-icon portfolio-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <h3>AI 创作作品集</h3>
                <p>AI 生成的图像、视频艺术，探索创作边界</p>
              </div>
              <div className="cta-arrow">→</div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
