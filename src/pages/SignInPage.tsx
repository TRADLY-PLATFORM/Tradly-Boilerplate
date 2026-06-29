import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignInMutation } from '@/state/auth/api'

export default function SignInPage() {
  const navigate = useNavigate()
  const [signIn, { isLoading }] = useSignInMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await signIn({ email, password, type: 'customer' })
    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Sign in failed')
      return
    }
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.sub}>Welcome back</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
          </div>

          <button style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/sign-up" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#111' },
  sub: { margin: '0 0 28px', fontSize: 14, color: '#888' },
  form: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 10 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', marginTop: 4 },
  btn: { marginTop: 8, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#2563eb', textDecoration: 'none', fontSize: 13 },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
}
