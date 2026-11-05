import { useGetListingsQuery } from '@/state/listing/api'
import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { locale } from '@/src/components/layout/locale'

export default function DonationSpotlight() {
  const { data } = useGetListingsQuery({ type: 'donation', page: 1, limit: 3 })
  const listings = data?.listings ?? []
  return <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-coffee-accent"><HeartHandshake className="h-6 w-6" /></p><h2 className="font-display text-2xl font-bold">{locale.labels.donationsTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{locale.labels.donationsDescription}</p></div>
      <Button asChild variant="outline" className="btn-secondary"><Link to="/donations">{locale.labels.exploreDonations}<ArrowRight className="ms-1 h-4 w-4" /></Link></Button>
    </div>
    {listings.length > 0 && <div className="grid gap-4 sm:grid-cols-3">{listings.map(listing => <Link key={listing.id} to={`/listing/${listing.slug}`} className="group overflow-hidden rounded-xl border border-border">
      <div className="aspect-[16/10] bg-muted">{listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />}</div>
      <p className="p-3 text-sm font-semibold group-hover:text-coffee-accent">{listing.title}</p>
    </Link>)}</div>}
  </section>
}
