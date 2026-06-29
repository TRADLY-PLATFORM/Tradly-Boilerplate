import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useCartItemCount } from '@/state/cart/selectors'
import { logout } from '@/state/auth/slice'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/state/store'

export default function Layout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)
  const firstName = useAuthSelector(s => s.firstName)
  const cartCount = useCartItemCount()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/sign-in')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: '#111', textDecoration: 'none' }}>Tradly</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: 14, color: '#555' }}>Hi, {firstName}</span>
              <Link to="/cart" style={{ position: 'relative', textDecoration: 'none', color: '#111', fontSize: 14 }}>
                Cart
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -8, right: -12, background: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #e5e5e5', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 14, color: '#555' }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/sign-in" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Sign in</Link>
              <Link to="/sign-up" style={{ fontSize: 14, background: '#2563eb', color: '#fff', borderRadius: 6, padding: '6px 16px', textDecoration: 'none' }}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
