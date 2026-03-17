import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminLogin.css'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-glow-1" />
        <div className="login-glow-2" />
        <div className="login-grid-bg" />
      </div>

      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-logo">
            <span style={{ color: 'var(--cyan)' }}>[</span>
            <span>MEET</span>
            <span style={{ color: 'var(--cyan)' }}>·AI</span>
            <span style={{ color: 'var(--cyan)' }}>]</span>
          </div>
          <h1 className="login-title">管理后台</h1>
          <p className="login-sub">ADMIN CONSOLE</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">USERNAME</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入管理账号"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <input
              type="password"
              className="form-input"
              placeholder="输入密码"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                登录中...
              </>
            ) : (
              <>
                进入后台
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="login-hint">
          默认账号: <code>meet-ai</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  )
}
