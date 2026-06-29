import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetPasswordMutation } from '@/state/auth/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [setPassword, { isLoading }] = useSetPasswordMutation()

  const [code, setCode] = useState('')
  const [password, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const verifyId = sessionStorage.getItem('reset_verify_id') ?? ''

  useEffect(() => {
    if (!verifyId) navigate('/forgot-password', { replace: true })
  }, [verifyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await setPassword({ verify_id: verifyId, code, password })
    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Reset failed')
      return
    }

    sessionStorage.removeItem('reset_verify_id')
    navigate('/sign-in')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset password</h1>
        <p style={styles.sub}>Enter the code from your email and choose a new password.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Reset code</label>
          <input style={styles.input} value={code} onChange={e => setCode(e.target.value)} placeholder="Enter code" required />

          <label style={styles.label}>New password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />

          <button style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? 'Resetting…' : 'Set new password'}
          </button>
        </form>
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
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
}
