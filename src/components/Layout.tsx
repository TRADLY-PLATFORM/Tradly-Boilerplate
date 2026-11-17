import React, { useEffect } from 'react'
import { cn } from '@/src/lib/utils'
import Header from './layout/Header'
import Footer from './layout/Footer'
import { useLayoutData } from './layout/useLayoutData'
import { BrandContext } from './layout/brandContext'
import { layoutConfig } from './layout/layout.config'

const BRAND_NAME = 'Tradly'

// The tab title and share/search description belong to the site's owner, never to the platform. Pages that set their
// own title (a listing page) keep it; only the default "<brand>" title and the generic description are filled in.
function useBrandMeta(brand: string, tagline: string) {
  useEffect(() => {
    if (!document.title || document.title === 'Online store' || document.title === 'Tradly App') document.title = brand
    const set = (selector: string, attr: string, value: string) => {
      const el = document.head.querySelector(selector)
      if (el && value && (!el.getAttribute(attr) || el.getAttribute(attr) === 'Browse, book and buy online.' || el.getAttribute(attr) === 'Online store')) el.setAttribute(attr, value)
    }
    set('meta[name="description"]', 'content', tagline)
    set('meta[property="og:title"]', 'content', brand)
    set('meta[property="og:description"]', 'content', tagline)
  }, [brand, tagline])
}

export default function Layout({ children, className }: { children: React.ReactNode; className?: string }) {
  const data = useLayoutData(BRAND_NAME)
  useBrandMeta(BRAND_NAME, layoutConfig.tagline)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header data={data} />
      <main className={cn('flex-1 container mx-auto px-4 py-8', className)}>
        <BrandContext.Provider value={BRAND_NAME}>{children}</BrandContext.Provider>
      </main>
      <Footer data={data} />
      {/* Platform credit, kept outside Footer.tsx so a redesigned footer cannot drop it. */}
      <div className="py-2 text-center text-xs bg-background text-muted-foreground">
        <a href="https://tradly.dev" target="_blank" rel="noopener" className="hover:underline">Powered by Tradly</a>
      </div>
    </div>
  )
}
