import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Portfolio from './pages/Portfolio'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>
      <div className="spinner" />
    </div>
  )
  return user ? children : <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/blog" element={<><Navbar /><Blog /></>} />
      <Route path="/blog/:slug" element={<><Navbar /><BlogDetail /></>} />
      <Route path="/portfolio" element={<><Navbar /><Portfolio /></>} />
      <Route path="/admin/login" element={user ? <Navigate to="/admin" replace /> : <AdminLogin />} />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
