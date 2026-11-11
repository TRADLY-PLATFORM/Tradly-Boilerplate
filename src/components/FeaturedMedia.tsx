import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useGetListingsQuery } from '@/state/listing/api'
import { getMedia } from '@/src/features/media/media'

/**
 * The newest video or audio listing as one large tile (for a hero). Renders nothing until the creator has published
 * something, so the hero simply stays a one-column hero.
 */
export default function FeaturedMedia({ orderType = 'video', className = '' }: { orderType?: string; className?: string }) {
  const { data } = useGetListingsQuery({ order_type: orderType, page: 1, limit: 1 })
  const item = data?.listings?.[0]
  if (!item) return null
  const media = getMedia(item)
  return (
    <Link to={`/watch/${item.slug || item.id}`} className={`group relative block aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ${className}`}>
      {item.images?.[0] && <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />}
      <span className="absolute inset-0 bg-black/35" />
      {media.kind !== 'none' && <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-110"><Play className="h-7 w-7 translate-x-0.5 fill-current" /></span>}
      <span className="absolute inset-x-0 bottom-0 p-5 text-left text-white">
        <span className="block font-display text-xl font-bold leading-snug line-clamp-2">{item.title}</span>
        {item.account?.name && <span className="mt-0.5 block text-sm text-white/75">{item.account.name}</span>}
      </span>
    </Link>
  )
}
