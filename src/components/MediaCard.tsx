import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Listing } from '@/types/listing.types'
import { getMedia } from '@/src/features/media/media'

/** A video or audio listing as a 16:9 tile with a play badge. It opens the watch page. */
export default function MediaCard({ listing, className = '' }: { listing: Listing; className?: string }) {
  const media = getMedia(listing)
  return (
    <Link to={`/watch/${listing.slug || listing.id}`} className={`group block ${className}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        {media.kind !== 'none' && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black opacity-90 shadow transition-transform group-hover:scale-110"><Play className="h-5 w-5 translate-x-0.5 fill-current" /></span>
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-coffee-accent">{listing.title}</h3>
      {listing.account?.name && <p className="mt-0.5 text-xs text-muted-foreground">{listing.account.name}</p>}
    </Link>
  )
}
