import { Link } from 'react-router-dom'
import { ArrowRight, Package, Store, UserRound } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuthSelector } from '@/state/auth/selectors'
import { locale } from '../components/layout/locale'

export default function AccountPage() {
  const firstName = useAuthSelector(state => state.firstName)
  const lastName = useAuthSelector(state => state.lastName)
  const email = useAuthSelector(state => state.email)
  const mobile = useAuthSelector(state => state.mobile)
  const dialCode = useAuthSelector(state => state.dialCode)
  const profilePic = useAuthSelector(state => state.profilePic)
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || locale.labels.account
  const phoneNumber = [dialCode, mobile].filter(Boolean).join(' ')

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-7">
          <p className="mb-1 text-sm text-muted-foreground">{locale.labels.profile}</p>
          <h1 className="font-display text-2xl font-bold text-foreground">{locale.labels.myAccount}</h1>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-4">
            {profilePic ? (
              <img src={profilePic} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-coffee-accent">
                <UserRound className="h-7 w-7" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-foreground">{fullName}</h2>
              <p className="text-sm text-muted-foreground">{email || locale.labels.notProvided}</p>
            </div>
          </div>

          <dl className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{locale.labels.email}</dt>
              <dd className="mt-1 break-all text-sm text-foreground">{email || locale.labels.notProvided}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{locale.labels.phone}</dt>
              <dd className="mt-1 text-sm text-foreground">{phoneNumber || locale.labels.notProvided}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link to="/orders" className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:bg-muted">
            <span className="flex items-center gap-3">
              <Package className="h-5 w-5 text-coffee-accent" />
              <span className="text-sm font-medium text-foreground">{locale.labels.myOrders}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/sell" className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:bg-muted">
            <span className="flex items-center gap-3">
              <Store className="h-5 w-5 text-coffee-accent" />
              <span className="text-sm font-medium text-foreground">{locale.labels.sell}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Layout>
  )
}
