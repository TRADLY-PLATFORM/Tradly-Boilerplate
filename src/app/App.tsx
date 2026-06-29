import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useRefreshAuthMutation } from '@/state/auth/api'
import { useAuthSelector } from '@/state/auth/selectors'
import SignInPage from '../pages/SignInPage'
import SignUpPage from '../pages/SignUpPage'
import VerifyOtpPage from '../pages/VerifyOtpPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import HomePage from '../pages/HomePage'
import ListingDetailPage from '../pages/ListingDetailPage'
import CartPage from '../pages/CartPage'

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [refreshAuth] = useRefreshAuthMutation()
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) await refreshAuth()
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Loading…
    </div>
  )
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:slug" element={<ListingDetailPage />} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  )
}
