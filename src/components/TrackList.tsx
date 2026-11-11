import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, Play } from 'lucide-react'
import { useGetListingsQuery } from '@/state/listing/api'
import type { Listing } from '@/types/listing.types'
import { getMedia, plainText } from '@/src/features/media/media'
import { locale } from '@/src/components/layout/locale'

/**
 * Audio listings (tracks, albums, episodes, sound packs) as rows: cover, title, creator, price and a play button that
 * plays the listing's audio (see src/features/media/media.ts for where the file comes from) right in the list; one
 * plays at a time. Pass `listings` to show what you already have (the home page's `listings`), or `orderType` to
 * fetch them (for example "digital"). A row with no audio file has no play button and just opens the listing.
 * With `hideEmpty` a fetched list that is empty renders nothing (no heading), so a template can always include it.
 */
export default function TrackList({ listings, orderType, limit = 12, title, subtitle, hideEmpty = false, className = '' }: { listings?: Listing[]; orderType?: string; limit?: number; title?: string; subtitle?: string; hideEmpty?: boolean; className?: string }) {
  const fetched = useGetListingsQuery({ order_type: orderType, page: 1, limit }, { skip: Boolean(listings) || !orderType })
  const items = (listings ?? fetched.data?.listings ?? []).slice(0, limit)
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<number | null>(null)

  useEffect(() => () => { audio.current?.pause(); audio.current = null }, [])

  const toggle = (item: Listing, src: string) => {
    if (playing === item.id) { audio.current?.pause(); setPlaying(null); return }
    audio.current?.pause()
    const next = new Audio(src)
    next.addEventListener('ended', () => setPlaying(null))
    next.addEventListener('error', () => setPlaying(null))
    audio.current = next
    setPlaying(item.id)
    void next.play().catch(() => setPlaying(null))
  }

  if (!listings && hideEmpty && !fetched.isLoading && items.length === 0) return null
  return (
    <section className={className}>
      {title && <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>}
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {items.length === 0 ? (
        !fetched.isLoading && <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">{locale.labels.mediaEmptyText}</p>
      ) : (
        <ol className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((item, index) => {
            const media = getMedia(item)
            const playable = media.kind === 'audio' || media.kind === 'video'
            const href = media.kind === 'none' ? `/l/${item.slug || item.id}` : `/watch/${item.slug || item.id}`
            return (
              <li key={item.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">{index + 1}</span>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.images?.[0] && <img src={item.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  {playable && (
                    <button type="button" onClick={() => toggle(item, media.src)} aria-label={`${playing === item.id ? locale.labels.mediaPause : locale.labels.mediaPlay}: ${item.title}`} className="absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-colors hover:bg-black/50">
                      {playing === item.id ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
                    </button>
                  )}
                </div>
                <Link to={href} className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground hover:text-coffee-accent">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.account?.name}{item.account?.name && plainText(item.description) ? ' · ' : ''}{plainText(item.description)}</span>
                </Link>
                {item.offer_price?.amount > 0 && <span className="shrink-0 font-display text-base font-semibold text-coffee-accent">{item.offer_price.formatted}</span>}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
