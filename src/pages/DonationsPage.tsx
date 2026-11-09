import { useGetListingsQuery } from '@/state/listing/api'
import Layout from '../components/Layout'
import { Button } from '@/src/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { locale } from '@/src/components/layout/locale'

export default function DonationsPage() {
  const { data, isLoading, isError } = useGetListingsQuery({ type: 'donation', page: 1, limit: 24 })
  const listings = data?.listings ?? []

  return <Layout>
    <header className="mb-8 rounded-2xl border border-border bg-card p-6 sm:p-9">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-coffee-accent/10 text-coffee-accent"><HeartHandshake className="h-6 w-6" /></div>
      <h1 className="font-display text-3xl font-bold text-foreground">{locale.labels.donationsTitle}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{locale.labels.donationsDescription}</p>
    </header>

    {isLoading ? <p role="status" className="py-16 text-center text-sm text-muted-foreground">{locale.labels.feedLoading}</p>
      : isError ? <p role="alert" className="py-16 text-center text-sm text-destructive">{locale.labels.donationsLoadError}</p>
      : listings.length === 0 ? <p className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">{locale.labels.donationsEmpty}</p>
      : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map(listing => {
          const goal = Number(listing.goal_price?.amount) || 0
          const raised = Number(typeof listing.raised_amount === 'object' ? listing.raised_amount?.amount : listing.raised_amount) || 0
          const progress = goal > 0 ? Math.min(100, Math.round(raised / goal * 100)) : null
          return <article key={listing.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <Link to={`/l/${listing.slug}`} className="block aspect-[4/3] bg-muted">
              {listing.images?.[0] ? <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><HeartHandshake className="h-10 w-10" /></div>}
            </Link>
            <div className="p-5">
              <p className="text-xs text-muted-foreground">{listing.account?.name ?? locale.labels.unknownSeller}</p>
              <h2 className="mt-1 line-clamp-2 font-display text-lg font-bold"><Link to={`/l/${listing.slug}`} className="hover:text-coffee-accent">{listing.title}</Link></h2>
              {progress !== null && <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{locale.labels.donationProgress}: {typeof listing.raised_amount === 'object' ? listing.raised_amount?.formatted : raised}</span><span className="font-semibold text-foreground">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-coffee-accent" style={{ width: `${progress}%` }} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{locale.labels.goal}: {listing.goal_price.formatted}</p>
              </div>}
              <Button asChild className="btn-hero mt-5 w-full"><Link to={`/l/${listing.slug}`}>{locale.labels.viewCampaign}<ArrowRight className="ms-1 h-4 w-4" /></Link></Button>
            </div>
          </article>
        })}
      </div>}
  </Layout>
}
