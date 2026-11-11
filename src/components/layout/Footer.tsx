// Design-only: Sky Builder may regenerate this file per site. All logic comes from `data`.
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { LayoutData } from './useLayoutData'
import { layoutConfig } from './layout.config'

export default function Footer({ data }: { data: LayoutData }) {
  const style = layoutConfig.footerStyle
  if (style === 'centered') {
    return (
      <footer className="mt-auto border-t border-border bg-background py-10 text-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-2 flex items-center justify-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-coffee-accent" />
            <span className="font-display text-lg font-bold">{data.brandName}</span>
          </div>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{data.tagline}</p>
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {data.footerLinkGroups.flatMap(group => group.links).map(link => (
              <Link key={link.to} to={link.to} className="text-muted-foreground transition-colors hover:text-coffee-accent">{link.label}</Link>
            ))}
          </nav>
          <p className="mt-6 text-xs text-muted-foreground">&copy; {data.year} {data.brandName}. {data.labels.allRightsReserved}</p>
        </div>
      </footer>
    )
  }
  const light = style === 'light'
  return (
    <footer className={`${light ? 'border-t border-border bg-card text-foreground' : 'bg-coffee-primary text-coffee-primary-foreground'} py-12 mt-auto`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ShoppingBag className="h-5 w-5" />
              <span className="font-display text-lg font-bold">{data.brandName}</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">{data.tagline}</p>
          </div>
          {data.footerLinkGroups.map(group => (
            <div key={group.title}>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-90">{group.title}</h4>
              <ul className="space-y-2 text-sm opacity-70">
                {group.links.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:opacity-100 transition-opacity">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`border-t ${light ? 'border-border' : 'border-coffee-primary-foreground/20'} mt-8 pt-6 text-center text-sm opacity-50`}>
          <p>&copy; {data.year} {data.brandName}. {data.labels.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  )
}
