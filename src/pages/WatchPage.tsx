import { Link, useParams } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Layout from '@/src/components/Layout'
import { Skeleton } from '@/src/components/ui/skeleton'
import MediaCard from '@/src/components/MediaCard'
import { useGetListingDetailQuery, useGetListingsQuery } from '@/state/listing/api'
import { getMedia } from '@/src/features/media/media'
import { locale } from '@/src/components/layout/locale'

/**
 * /watch/:slug: plays a video or audio listing (see src/features/media/media.ts for where the file comes from),
 * with the creator and more from the same creator underneath. A listing with nothing to play still shows its picture,
 * title and description, so a creator who has not added the file yet never gets a broken page.
 */
export default function WatchPage() {
  const { slug = '' } = useParams()
  const { data, isLoading, isError } = useGetListingDetailQuery({ slug })
  const listing = data?.listing
  const media = getMedia(listing)
  const accountId = listing?.account?.id
  const more = useGetListingsQuery({ page: 1, limit: 8, ...(accountId ? { account_id: accountId } : {}) }, { skip: !accountId })
  const others = (more.data?.listings ?? []).filter(item => item.id !== listing?.id && getMedia(item).kind !== 'none').slice(0, 4)

  return (
    <Layout>
      {isLoading ? (
        <div className="mx-auto max-w-4xl"><Skeleton className="aspect-video w-full" /><Skeleton className="mt-4 h-7 w-2/3" /></div>
      ) : isError || !listing ? (
        <p role="alert" className="py-20 text-center text-sm text-muted-foreground">{locale.labels.watchNotFound}</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl bg-black">
            {media.kind === 'video' && (
              <video key={media.src} controls playsInline preload="metadata" poster={listing.images?.[0]} className="aspect-video w-full bg-black">
                <source src={media.src} />
              </video>
            )}
            {media.kind === 'embed' && (
              <iframe key={media.src} title={listing.title} src={media.src} className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            )}
            {media.kind === 'audio' && (
              <div className="flex flex-col items-center gap-5 bg-gradient-to-br from-[hsl(var(--hero-from,var(--coffee-primary)))] to-[hsl(var(--hero-to,var(--coffee-accent)))] p-8 sm:flex-row">
                {listing.images?.[0] && <img src={listing.images[0]} alt="" className="h-40 w-40 shrink-0 rounded-xl object-cover shadow-lg" />}
                <audio key={media.src} controls preload="metadata" src={media.src} className="w-full" />
              </div>
            )}
            {media.kind === 'none' && (
              <div className="relative flex aspect-video items-center justify-center bg-muted">
                {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />}
                <p className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white">{locale.labels.watchNoFile}</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{listing.title}</h1>
              {listing.account?.name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale.labels.watchBy} <Link to={`/s/${listing.account.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">{listing.account.name}</Link>
                </p>
              )}
            </div>
            {listing.likes > 0 && <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Heart className="h-4 w-4" />{listing.likes}</span>}
          </div>
          {listing.description && <div className="prose prose-sm mt-4 max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: listing.description }} />}
          {others.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-xl font-bold text-foreground">{locale.labels.watchMore}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{others.map(item => <MediaCard key={item.id} listing={item} />)}</div>
            </section>
          )}
        </div>
      )}
    </Layout>
  )
}
