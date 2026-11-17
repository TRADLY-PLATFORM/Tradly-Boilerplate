import { useEffect, useState } from 'react'
import { AppConfig } from '@/config/app.config'
import { useAuthSelector } from '@/state/auth/selectors'
import { identifyAnalyticsUser, tenantIdFromDomain, tenantIdFromKey } from '@/src/lib/analytics'

const SCRIPT_ID = 'tradly-analytics-tracker'

/**
 * Loads the Tradly analytics tracker for this store, the way the Tradly storefront does: the store's tenant id is the
 * analytics project (each business owns its own), so it is both `data-project` and `data-tenant-id`. Page views, clicks,
 * browser errors and failed requests then show up in that business's own Tradly analytics. The signed-in user is
 * identified as `tenant:<id>:user:<id>`. No tenant id (from the key, or from Tradly's domain lookup), no tracker.
 */
export default function TradlyAnalytics() {
  const userId = useAuthSelector((s) => s.userId)
  // Usually the store's key carries the tenant id. If it does not, ask Tradly which tenant owns this domain.
  const [tenantId, setTenantId] = useState(() => tenantIdFromKey(AppConfig.pkKey))
  useEffect(() => {
    if (tenantId) return
    let cancelled = false
    tenantIdFromDomain(AppConfig.domain, AppConfig.env).then((id) => { if (!cancelled && id) setTenantId(id) })
    return () => { cancelled = true }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId || typeof document === 'undefined' || document.getElementById(SCRIPT_ID)) return
    try {
      // On localhost the dev server proxies the tracker (vite.config.ts) so it loads without CORS trouble.
      const base = window.location.hostname === 'localhost' ? `${window.location.origin}/tradly-analytics` : 'https://analytics.tradly.dev'
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.defer = true
      script.src = `${base}/tracker.js`
      script.dataset.server = base
      script.dataset.project = tenantId
      script.dataset.tenantId = tenantId
      // If it fails to load (ad blocker, network), remove the tag so a later mount can try again.
      script.onerror = () => script.remove()
      document.head.appendChild(script)
    } catch {
      /* analytics must never throw */
    }
  }, [tenantId])

  useEffect(() => {
    if (tenantId && userId) identifyAnalyticsUser({ tenantId, userId })
  }, [tenantId, userId])

  return null
}
