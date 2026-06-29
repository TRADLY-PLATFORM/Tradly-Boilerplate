import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForgotPasswordMutation } from '@/state/auth/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await forgotPassword({ email })
    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Request failed')
      return
    }

    // Store verifyId in sessionStorage so reset-password page can use it
    sessionStorage.setItem('reset_verify_id', result.data.verify_id)
    navigate('/reset-password')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot password</h1>
        <p style={styles.sub}>We'll send a reset code to your email.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

          <button style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/sign-in" style={styles.link}>← Back to sign in</Link>
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
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none' },
  btn: { marginTop: 16, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#2563eb', textDecoration: 'none', fontSize: 13 },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
}
