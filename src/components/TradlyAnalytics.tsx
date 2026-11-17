import { useEffect, useState } from 'react'
import { AppConfig } from '@/config/app.config'
import { useAuthSelector } from '@/state/auth/selectors'
import { identifyAnalyticsUser, tenantIdFromDomain, tenantIdFromKey, trackEvent } from '@/src/lib/analytics'
import { installDemoErrorReporter } from '@/src/lib/errorReport'

const SCRIPT_ID = 'tradly-analytics-tracker'

// Set only by the live template demos' build (templates/demo.sh in Sky): every demo shares one analytics project and is
// told apart by its template id. A customer's site has neither variable, so it uses its own tenant as its project.
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
const DEMO_PROJECT = (env.VITE_TRADLY_ANALYTICS_PROJECT ?? '').trim()
const TEMPLATE_ID = (env.VITE_TRADLY_TEMPLATE_ID ?? '').trim()

/**
 * Loads the Tradly analytics tracker for this store, the way the Tradly storefront does: the store's tenant id is the
 * analytics project (each business owns its own), so it is both `data-project` and `data-tenant-id`. Page views, clicks,
 * browser errors and failed requests then show up in that business's own Tradly analytics. The signed-in user is
 * identified as `tenant:<id>:user:<id>`. No tenant id (from the key, or from Tradly's domain lookup), no tracker.
 * The live template demos instead share one project (VITE_TRADLY_ANALYTICS_PROJECT) and report errors to Sky.
 */
export default function TradlyAnalytics() {
  const userId = useAuthSelector((s) => s.userId)
  // Usually the store's key carries the tenant id. If it does not, ask Tradly which tenant owns this domain.
  const [tenantId, setTenantId] = useState(() => (DEMO_PROJECT ? '' : tenantIdFromKey(AppConfig.pkKey)))
  useEffect(() => {
    if (tenantId || DEMO_PROJECT) return
    let cancelled = false
    tenantIdFromDomain(AppConfig.domain, AppConfig.env).then((id) => { if (!cancelled && id) setTenantId(id) })
    return () => { cancelled = true }
  }, [tenantId])

  // A demo: one shared project for every demo, a `site_context` event that names the template, and errors reported to Sky.
  useEffect(() => {
    if (!DEMO_PROJECT || !TEMPLATE_ID) return
    installDemoErrorReporter(TEMPLATE_ID)
    trackEvent('site_context', { template_id: TEMPLATE_ID, demo: true, host: window.location.host })
  }, [])

  const project = DEMO_PROJECT || tenantId
  useEffect(() => {
    if (!project || typeof document === 'undefined' || document.getElementById(SCRIPT_ID)) return
    try {
      // On localhost the dev server proxies the tracker (vite.config.ts) so it loads without CORS trouble.
      const base = window.location.hostname === 'localhost' ? `${window.location.origin}/tradly-analytics` : 'https://analytics.tradly.dev'
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.async = true
      script.defer = true
      script.src = `${base}/tracker.js`
      script.dataset.server = base
      script.dataset.project = project
      if (!DEMO_PROJECT) script.dataset.tenantId = tenantId
      // If it fails to load (ad blocker, network), remove the tag so a later mount can try again.
      script.onerror = () => script.remove()
      document.head.appendChild(script)
    } catch {
      /* analytics must never throw */
    }
  }, [project, tenantId])

  useEffect(() => {
    if (tenantId && userId) identifyAnalyticsUser({ tenantId, userId })
  }, [tenantId, userId])

  return null
}
