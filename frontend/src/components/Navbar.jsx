import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const NAV_LINKS = [
  { path: '/', label: 'HOME', mono: '01' },
  { path: '/blog', label: 'BLOG', mono: '02' },
  { path: '/portfolio', label: 'WORKS', mono: '03' },
]

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="logo-bracket">[</span>
          <span className="logo-text">MEET<span className="logo-ai">·AI</span></span>
          <span className="logo-bracket">]</span>
        </Link>

        {/* Desktop nav */}
        <ul className="nav-links">
          {NAV_LINKS.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                <span className="nav-mono">{link.mono}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="nav-actions">
          {user ? (
            <Link to="/admin" className="btn btn-ghost nav-admin-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              ADMIN
            </Link>
          ) : (
            <Link to="/admin/login" className="btn btn-ghost nav-admin-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              LOGIN
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {NAV_LINKS.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            <span className="nav-mono">{link.mono}</span>
            {link.label}
          </Link>
        ))}
        {user
          ? <Link to="/admin" className="mobile-link">⚙ ADMIN</Link>
          : <Link to="/admin/login" className="mobile-link">⚙ LOGIN</Link>
        }
      </div>
    </nav>
  )
}
