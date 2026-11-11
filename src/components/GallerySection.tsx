import { useGetListingsQuery } from '@/state/listing/api'
import { locale } from '@/src/components/layout/locale'

/**
 * A photo grid built from the store's own listing pictures (the owner adds listings in Tradly; there is nothing to
 * upload twice). Shows up to `limit` distinct pictures, one per listing first. Renders nothing when there are fewer
 * than `min` pictures, so a template can always include it.
 */
export default function GallerySection({ title, subtitle, limit = 8, min = 4, id, className = '' }: { title?: string; subtitle?: string; limit?: number; min?: number; id?: string; className?: string }) {
  const { data, isLoading } = useGetListingsQuery({ page: 1, limit: 30 })
  const seen = new Set<string>()
  const pictures: { src: string; alt: string }[] = []
  const listings = data?.listings ?? []
  for (const pass of [0, 1]) {
    for (const listing of listings) {
      const src = listing.images?.[pass]
      if (src && !seen.has(src)) { seen.add(src); pictures.push({ src, alt: listing.title }) }
    }
  }
  const shown = pictures.slice(0, limit)
  if (isLoading || shown.length < min) return null
  return (
    <section id={id} className={`mt-16 ${className}`}>
      <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title ?? locale.labels.galleryTitle}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {shown.map((picture, index) => (
          <div key={picture.src} className={`overflow-hidden rounded-xl bg-muted ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <img src={picture.src} alt={picture.alt} loading="lazy" className="h-full w-full object-cover aspect-square" />
          </div>
        ))}
      </div>
    </section>
  )
}
