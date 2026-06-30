import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGetOrderDetailQuery } from '@/state/orders/api'
import Layout from '../components/Layout'

// Tradly external_checkout redirects back with ?order_reference=...
// This page verifies payment status then routes to success or failure.

type Status = 'checking' | 'success' | 'failed' | 'timeout' | 'unknown'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30_000   // give up after 30s

export default function PaymentReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderRef =
    searchParams.get('order_reference') ??
    localStorage.getItem('pending_order_reference') ??
    ''

  const [status, setStatus] = useState<Status>(orderRef ? 'checking' : 'unknown')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stop polling once we have a terminal status
  const isChecking = status === 'checking'

  const { data, isError } = useGetOrderDetailQuery(orderRef, {
    skip: !orderRef || !isChecking,
    pollingInterval: isChecking ? POLL_INTERVAL_MS : 0,
    refetchOnMountOrArgChange: true,
  })

  // Start 30s timeout when we begin checking
  useEffect(() => {
    if (!isChecking) return
    timeoutRef.current = setTimeout(() => setStatus('timeout'), POLL_TIMEOUT_MS)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [isChecking])

  useEffect(() => {
    if (!data || !isChecking) return
    const order = (data as any).order
    // payment_status: 1 = pending, 2 = paid, 3 = failed, 4 = refunded
    const paymentStatus: number = order?.payment_status ?? 1
    if (paymentStatus === 2) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      localStorage.removeItem('pending_order_reference')
      setStatus('success')
    } else if (paymentStatus === 3 || paymentStatus === 4) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setStatus('failed')
    }
    // status 1 = still pending — keep polling until timeout
  }, [data, isChecking])

  useEffect(() => {
    if (isError) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setStatus('unknown')
    }
  }, [isError])

  // Auto-navigate to thank-you on confirmed success
  useEffect(() => {
    if (status === 'success' && orderRef) {
      navigate(`/thank-you/${orderRef}`, { replace: true })
    }
  }, [status, orderRef])

  return (
    <Layout>
      <div style={s.wrap}>
        <div style={s.card}>
          {status === 'checking' && (
            <>
              <div style={s.spinner}>⏳</div>
              <h2 style={s.title}>Verifying your payment…</h2>
              <p style={s.sub}>Please wait while we confirm your payment with the provider.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={s.icon}>✅</div>
              <h2 style={s.title}>Payment confirmed!</h2>
              <p style={s.sub}>Redirecting you to your order…</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div style={s.icon}>❌</div>
              <h2 style={s.title}>Payment failed</h2>
              <p style={s.sub}>Your payment was not completed. You can try again or choose a different payment method.</p>
              <div style={s.actions}>
                <button style={s.primaryBtn} onClick={() => navigate('/checkout')}>Try again</button>
                <button style={s.secondaryBtn} onClick={() => navigate('/')}>Back to home</button>
              </div>
            </>
          )}

          {status === 'timeout' && (
            <>
              <div style={s.icon}>⌛</div>
              <h2 style={s.title}>Taking longer than expected</h2>
              <p style={s.sub}>We couldn't confirm your payment yet. Check your orders page — if it appears there, your payment went through.</p>
              <div style={s.actions}>
                <button style={s.primaryBtn} onClick={() => navigate('/orders')}>View my orders</button>
                <button style={s.secondaryBtn} onClick={() => { setStatus('checking') }}>Check again</button>
              </div>
            </>
          )}

          {status === 'unknown' && (
            <>
              <div style={s.icon}>⚠️</div>
              <h2 style={s.title}>Payment status unknown</h2>
              <p style={s.sub}>We could not verify your payment. Check your orders page or contact support with your order reference.</p>
              {orderRef && <p style={s.ref}>Ref: {orderRef}</p>}
              <div style={s.actions}>
                <button style={s.primaryBtn} onClick={() => navigate('/orders')}>View my orders</button>
                <button style={s.secondaryBtn} onClick={() => navigate('/')}>Back to home</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' },
  card: { background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.08)' },
  spinner: { fontSize: 48, marginBottom: 20 },
  icon: { fontSize: 48, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 10px' },
  sub: { fontSize: 14, color: '#666', margin: '0 0 28px', lineHeight: 1.6 },
  ref: { fontSize: 12, color: '#999', fontFamily: 'monospace', marginBottom: 20 },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  primaryBtn: { padding: '13px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '12px', background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
