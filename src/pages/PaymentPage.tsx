import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Stripe.js is loaded via CDN — declare minimal types needed
declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance
  }
}
interface StripeInstance {
  elements: (opts?: Record<string, unknown>) => StripeElements
  confirmPayment: (opts: Record<string, unknown>) => Promise<{ error?: { message: string } }>
}
interface StripeElements {
  create: (type: string, opts?: Record<string, unknown>) => StripeElement
  submit: () => Promise<{ error?: { message: string } }>
}
interface StripeElement {
  mount: (el: HTMLElement) => void
  destroy: () => void
}

interface LocationState {
  client_secret: string
  order_reference: string
}

const STRIPE_PK = import.meta.env.VITE_STRIPE_PK ?? ''

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)

  const stripeRef = useRef<StripeInstance | null>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const paymentElRef = useRef<StripeElement | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!state?.client_secret) {
      navigate('/', { replace: true })
      return
    }

    if (!STRIPE_PK) {
      setError('Stripe public key is not configured (VITE_STRIPE_PK).')
      return
    }

    const loadStripe = async () => {
      // Load Stripe.js if not already present
      if (!window.Stripe) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://js.stripe.com/v3/'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Stripe.js'))
          document.head.appendChild(s)
        })
      }

      stripeRef.current = window.Stripe!(STRIPE_PK)
      elementsRef.current = stripeRef.current.elements({
        clientSecret: state!.client_secret,
        appearance: { theme: 'stripe' },
      })

      paymentElRef.current = elementsRef.current.create('payment')
      if (mountRef.current) {
        paymentElRef.current.mount(mountRef.current)
        setStripeReady(true)
      }
    }

    loadStripe().catch(err => setError(err.message))

    return () => {
      paymentElRef.current?.destroy()
    }
  }, [])

  const handlePay = async () => {
    if (!stripeRef.current || !elementsRef.current) return
    setLoading(true)
    setError('')

    const submitResult = await elementsRef.current.submit()
    if (submitResult.error) {
      setError(submitResult.error.message ?? 'Validation error')
      setLoading(false)
      return
    }

    const result = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you/${state!.order_reference}`,
      },
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message ?? 'Payment failed')
      setLoading(false)
    } else {
      navigate(`/thank-you/${state!.order_reference}`)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Complete payment</h1>

        {error && <div style={s.errorBox}>{error}</div>}

        <div ref={mountRef} style={s.stripeMount} />

        <button
          style={{ ...s.btn, opacity: loading || !stripeReady ? 0.6 : 1 }}
          disabled={loading || !stripeReady}
          onClick={handlePay}
        >
          {loading ? 'Processing…' : 'Pay now'}
        </button>

        <button style={s.cancelBtn} onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif', padding: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 36, width: '100%', maxWidth: 480, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
  title: { margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#111' },
  stripeMount: { minHeight: 160, marginBottom: 24 },
  btn: { width: '100%', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  cancelBtn: { width: '100%', padding: '12px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 },
}
