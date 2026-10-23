// Design-only: Sky Builder may regenerate this file per site. All logic comes from `data`.
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import type { LayoutData } from './useLayoutData'

export default function Footer({ data }: { data: LayoutData }) {
  return (
    <footer className="bg-coffee-primary text-coffee-primary-foreground py-12 mt-auto">
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
        <div className="border-t border-coffee-primary-foreground/20 mt-8 pt-6 text-center text-sm opacity-50">
          <p>&copy; {data.year} {data.brandName}. {data.labels.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  )
}
