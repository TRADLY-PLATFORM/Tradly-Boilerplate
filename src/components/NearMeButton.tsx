import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { locale } from '@/src/components/layout/locale'

/**
 * "Near me" for the home page: asks the browser for the visitor's position once, then keeps it in the address
 * (`?lat=&lon=`). The home page passes lat, lon and a radius to the listings query and shows the distance on each card.
 * Tapping it again clears the filter. The position is never stored or sent anywhere else.
 */
export default function NearMeButton({ className = '' }: { className?: string }) {
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState<'idle' | 'asking' | 'denied'>('idle')
  const active = Boolean(params.get('lat') && params.get('lon'))

  const toggle = () => {
    if (active) {
      const next = new URLSearchParams(params)
      next.delete('lat'); next.delete('lon')
      setParams(next, { replace: true })
      return
    }
    if (!('geolocation' in navigator)) { setState('denied'); return }
    setState('asking')
    navigator.geolocation.getCurrentPosition(
      position => {
        const next = new URLSearchParams(params)
        next.set('lat', position.coords.latitude.toFixed(5))
        next.set('lon', position.coords.longitude.toFixed(5))
        setParams(next, { replace: true })
        setState('idle')
        document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })
      },
      () => setState('denied'),
      { timeout: 10000, maximumAge: 300000 },
    )
  }

  return (
    <div className={className}>
      <button type="button" onClick={toggle} disabled={state === 'asking'} className={active ? 'btn-hero inline-flex items-center gap-2' : 'btn-secondary inline-flex items-center gap-2'}>
        <MapPin className="h-4 w-4" />
        {state === 'asking' ? locale.labels.nearMeLocating : active ? locale.labels.nearMeOn : locale.labels.nearMe}
      </button>
      {state === 'denied' && <p role="alert" className="mt-2 text-sm text-destructive">{locale.labels.nearMeDenied}</p>}
    </div>
  )
}
