// Errors-only reporting for the live template demos (<id>.haifa.my). It exists so the team can see what breaks in each
// template. It runs ONLY when the build has VITE_TRADLY_TEMPLATE_ID (demo builds set it; a customer's site never does, so
// this is inert there). It sends no visitor data: just the error text, the page and the template id, to Sky's error report
// (`/internal/client-errors` on the server groups them by template, message and how many browsers hit them).

const REPORT_URL = 'https://vibe.tradly.app/api/client-errors'
const MAX_PER_PAGE_LOAD = 8

let installed = false

export function installDemoErrorReporter(templateId: string) {
  if (installed || !templateId || typeof window === 'undefined') return
  installed = true
  const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const seen = new Set<string>()
  const nativeFetch = window.fetch.bind(window)

  const report = (kind: string, message: string, endpoint?: string, status?: number) => {
    try {
      const text = `${kind}: ${String(message || '').replace(/\s+/g, ' ').slice(0, 200)}`
      if (seen.size >= MAX_PER_PAGE_LOAD || seen.has(text)) return
      seen.add(text)
      void nativeFetch(REPORT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: `template-demo:${templateId}`,
          message: text,
          endpoint: endpoint ? endpoint.split('?')[0].slice(0, 160) : undefined,
          status,
          page: `${window.location.host}${window.location.pathname}`.slice(0, 200),
          sessionId,
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      /* reporting must never throw */
    }
  }

  window.addEventListener('error', (event) => {
    const target = event.target as (HTMLElement & { src?: string; href?: string }) | null
    if (target && target !== (window as unknown as EventTarget) && (target.src || target.href)) {
      report('resource', `${target.tagName} failed to load`, target.src || target.href)
      return
    }
    report('script', event.message || 'error', event.filename)
  }, true)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string } | string | undefined
    report('promise', typeof reason === 'string' ? reason : reason?.message || 'unhandled rejection')
  })

  // Failed API calls: network errors and server errors, plus 400/404/422 (bad request). Not 401/403, which are normal for a guest.
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : (args[0] as Request).url
    try {
      const response = await nativeFetch(...args)
      if (url !== REPORT_URL && (response.status >= 500 || [400, 404, 422].includes(response.status))) {
        report('request', `HTTP ${response.status}`, url, response.status)
      }
      return response
    } catch (error) {
      if (url !== REPORT_URL) report('request', (error as Error)?.message || 'network error', url)
      throw error
    }
  }
}
