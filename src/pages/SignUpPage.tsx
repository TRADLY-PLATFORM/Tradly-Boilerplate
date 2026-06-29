import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignUpMutation } from '@/state/auth/api'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [signUp, { isLoading }] = useSignUpMutation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const input = { first_name: firstName, last_name: lastName, email, password, type: 'customer' as const }
    const result = await signUp(input)

    if ('error' in result) {
      setError((result.error as { error: string }).error ?? 'Sign up failed')
      return
    }

    // Store input so OTP screen can call resendOtp without asking again
    sessionStorage.setItem('signup_input', JSON.stringify(input))
    navigate('/verify-otp')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Join the marketplace</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={styles.label}>First name</label>
              <input style={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" required />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={styles.label}>Last name</label>
              <input style={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required />
            </div>
          </div>

          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />

          <button style={{ ...styles.btn, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/sign-in" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#111' },
  sub: { margin: '0 0 28px', fontSize: 14, color: '#888' },
  form: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 10 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none' },
  btn: { marginTop: 12, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#2563eb', textDecoration: 'none', fontSize: 13 },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 },
}
