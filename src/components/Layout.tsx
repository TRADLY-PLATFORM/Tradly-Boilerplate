import React from 'react'
import { cn } from '@/src/lib/utils'
import Header from './layout/Header'
import Footer from './layout/Footer'
import { useLayoutData } from './layout/useLayoutData'

const BRAND_NAME = 'Tradly'

export default function Layout({ children, className }: { children: React.ReactNode; className?: string }) {
  const data = useLayoutData(BRAND_NAME)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header data={data} />
      <main className={cn('flex-1 container mx-auto px-4 py-8', className)}>
        {children}
      </main>
      <Footer data={data} />
    </div>
  )
}
