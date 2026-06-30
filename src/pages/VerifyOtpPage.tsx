import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVerifyOtpMutation, useResendOtpMutation } from '@/state/auth/api'
import { useAuthSelector } from '@/state/auth/selectors'
import type { ResendOtpInput } from '@/types/auth.types'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const verifyId = useAuthSelector(s => s.verifyId)
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Guard — redirect back if user lands here without a verifyId
  useEffect(() => {
    if (!verifyId) navigate('/sign-up', { replace: true })
  }, [verifyId])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyId) return
    setError('')

    const result = await verifyOtp({ verify_id: verifyId, code })
    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Invalid code')
      return
    }

    sessionStorage.removeItem('signup_input')
    navigate('/')
  }

  const handleResend = async () => {
    setError('')
    setSuccessMsg('')
    const raw = sessionStorage.getItem('signup_input')
    if (!raw) { navigate('/sign-up', { replace: true }); return }

    const input = JSON.parse(raw) as ResendOtpInput
    const result = await resendOtp(input)
    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Resend failed')
      return
    }
    setSuccessMsg('New code sent — check your inbox.')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Verify your email</h1>
        <p style={styles.sub}>Enter the 6-digit code we sent you.</p>

        {error && <div style={styles.errorBox}>{error}</div>}
        {successMsg && <div style={styles.successBox}>{successMsg}</div>}

        <form onSubmit={handleVerify} style={styles.form}>
          <label style={styles.label}>Verification code</label>
          <input
            style={{ ...styles.input, letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
          />

          <button style={{ ...styles.btn, opacity: isVerifying ? 0.7 : 1 }} disabled={isVerifying || code.length < 6}>
            {isVerifying ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <p style={styles.footer}>
          Didn't receive it?{' '}
          <button onClick={handleResend} disabled={isResending} style={styles.resendBtn}>
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
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
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' },
  resendBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
  successBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
}
