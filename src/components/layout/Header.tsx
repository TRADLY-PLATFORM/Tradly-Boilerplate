// Design-only: Sky Builder may regenerate this file per site. All logic comes from `data`.
import { Link } from 'react-router-dom'
import { ShoppingCart, User, LogOut, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import type { LayoutData } from './useLayoutData'

export default function Header({ data }: { data: LayoutData }) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt={data.brandName} className="h-8 w-auto" />
          ) : (
            <ShoppingBag className="h-7 w-7 text-coffee-accent" />
          )}
          <span className="font-display text-xl font-bold text-foreground">{data.brandName}</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {data.navLinks.map(link => (
            <Link key={link.to} to={link.to} className="text-sm text-foreground hover:text-coffee-accent transition-colors">
              {link.label}
            </Link>
          ))}
          {data.categoryLinks.length > 0 && (
            <div className="group relative">
              <button type="button" className="flex items-center gap-1 text-sm text-foreground hover:text-coffee-accent transition-colors">
                {data.labels.categories} <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 hidden pt-2 group-hover:block group-focus-within:block z-50">
                <div className="w-52 rounded-lg bg-background shadow-lg py-1">
                  {data.categoryLinks.map(link => (
                    <Link key={link.to} to={link.to} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {data.showCart && (
            <Link to={data.cartLink}>
              <Button variant="outline" size="sm" className="btn-secondary relative">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                {data.labels.cart}
                {data.cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-coffee-accent text-coffee-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {data.cartCount > 9 ? '9+' : data.cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          {data.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 inline mr-1" />
                {data.firstName || data.labels.account}
              </span>
              <Button variant="ghost" size="sm" onClick={data.logout} className="text-muted-foreground hover:text-destructive gap-1.5">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {data.signInLink && (
                <Link to={data.signInLink}>
                  <Button variant="ghost" size="sm" className="text-sm">{data.labels.signIn}</Button>
                </Link>
              )}
              {data.signUpLink && (
                <Link to={data.signUpLink}>
                  <Button size="sm" className="btn-hero text-sm px-4">{data.labels.signUp}</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <button className="md:hidden p-2 rounded-md text-foreground" onClick={data.toggleMobile} aria-label={data.labels.menu}>
          {data.mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {data.mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          {data.navLinks.map(link => (
            <Link key={link.to} to={link.to} className="text-sm" onClick={data.closeMobile}>{link.label}</Link>
          ))}
          {data.categoryLinks.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{data.labels.categories}</p>
              {data.categoryLinks.map(link => (
                <Link key={link.to} to={link.to} className="text-sm pl-2" onClick={data.closeMobile}>{link.label}</Link>
              ))}
            </>
          )}
          {data.showCart && (
            <Link to={data.cartLink} className="text-sm" onClick={data.closeMobile}>{data.labels.cart} ({data.cartCount})</Link>
          )}
          {data.isAuthenticated ? (
            <button onClick={data.logout} className="text-sm text-left text-destructive">{data.labels.signOut}</button>
          ) : (
            <>
              {data.signInLink && <Link to={data.signInLink} className="text-sm" onClick={data.closeMobile}>{data.labels.signIn}</Link>}
              {data.signUpLink && <Link to={data.signUpLink} className="text-sm" onClick={data.closeMobile}>{data.labels.signUp}</Link>}
            </>
          )}
        </div>
      )}
    </header>
  )
}
