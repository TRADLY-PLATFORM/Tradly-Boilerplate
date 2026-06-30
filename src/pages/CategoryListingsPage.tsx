import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGetCategoryBySlugQuery, useGetCategoryListingsQuery } from '@/state/categories/api'
import { useLikeListingMutation, useUnlikeListingMutation } from '@/state/listing/api'
import { useAuthSelector } from '@/state/auth/selectors'
import Layout from '../components/Layout'

function getCategorySlug(category: { id: string | number; name: string; slug?: string }): string {
  return category.slug ?? `${category.id}-${String(category.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

export default function CategoryListingsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthSelector(s => s.isAuthenticated)

  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Reset page when slug changes
  useEffect(() => { setPage(1) }, [slug])

  const { data: catData, isLoading: catLoading, isError: catError } =
    useGetCategoryBySlugQuery(slug, { skip: !slug })

  const category = catData?.category

  // Redirect on bad slug
  useEffect(() => {
    if (!catLoading && catError) navigate('/', { replace: true })
  }, [catLoading, catError])

  const { data: listData, isLoading: listLoading, isFetching } =
    useGetCategoryListingsQuery(
      { category_id: category?.id ?? 0, page },
      { skip: !category?.id },
    )

  const [likeListing, { isLoading: isLiking }] = useLikeListingMutation()
  const [unlikeListing, { isLoading: isUnliking }] = useUnlikeListingMutation()

  const handleLike = async (listingId: number, liked: boolean) => {
    if (!isAuthenticated) { navigate('/sign-in'); return }
    if (isLiking || isUnliking) return
    const result = liked
      ? await unlikeListing({ id: listingId })
      : await likeListing({ id: listingId })
    if ('error' in result) showToast('Failed to update like')
  }

  const listings   = listData?.listings ?? []
  const totalPages = Math.ceil((listData?.total_records ?? 0) / 30)
  const currentPage = listData?.page ?? page

  if (catLoading) return <Layout><div style={s.center}>Loading…</div></Layout>
  if (!category) return null

  return (
    <Layout>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/" style={s.breadLink}>Home</Link>
        {category.hierarchy?.map(item => (
          <React.Fragment key={item.id}>
            <span style={s.breadSep}>›</span>
            <Link to={`/lc/${getCategorySlug(item as { id: string | number; name: string; slug?: string })}`} style={s.breadLink}>
              {item.name}
            </Link>
          </React.Fragment>
        ))}
        <span style={s.breadSep}>›</span>
        <span style={s.breadCurrent}>{category.name}</span>
      </div>

      {/* Category header */}
      <div style={s.catHeader}>
        {category.image && (
          <div style={s.catImgWrap}>
            <img src={category.image} alt={category.name} style={s.catImg} />
          </div>
        )}
        <div>
          <h1 style={s.catName}>{category.name}</h1>
          {category.description && <p style={s.catDesc}>{category.description}</p>}
        </div>
      </div>

      {/* Subcategory chips */}
      {(category.sub_category?.length ?? 0) > 0 && (
        <div style={s.subCats}>
          {category.sub_category!.map(sub => (
            <Link
              key={sub.id}
              to={`/lc/${getCategorySlug(sub as { id: string | number; name: string; slug?: string })}`}
              style={s.subChip}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Stats + fetching indicator */}
      <div style={s.statsRow}>
        {listData?.total_records != null && (
          <span style={s.countLabel}>{listData.total_records} listing{listData.total_records !== 1 ? 's' : ''}</span>
        )}
        {isFetching && <span style={s.fetching}>Loading…</span>}
      </div>

      {/* Listings grid */}
      {listLoading ? (
        <div style={s.center}>Loading listings…</div>
      ) : listings.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: 16, color: '#888' }}>No listings in this category yet.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {listings.map(listing => (
            <Link key={listing.id} to={`/listing/${listing.slug}`} style={s.card}>
              {/* Image */}
              <div style={s.cardImgWrap}>
                {listing.images[0]
                  ? <img src={listing.images[0]} alt={listing.title} style={s.cardImg} />
                  : <div style={s.cardImgPlaceholder} />
                }
                {listing.offer_percent > 0 && (
                  <div style={s.discountBadge}>{listing.offer_percent}% OFF</div>
                )}
                {listing.stock === 0 && (
                  <div style={s.outOfStockBadge}>Out of stock</div>
                )}
                {/* Like button */}
                <button
                  style={s.likeBtn}
                  onClick={e => { e.preventDefault(); handleLike(listing.id, listing.liked) }}
                  disabled={isLiking || isUnliking}
                  title={listing.liked ? 'Unlike' : 'Like'}
                >
                  {listing.liked ? '♥' : '♡'}
                </button>
              </div>

              {/* Info */}
              <div style={s.cardBody}>
                <p style={s.cardSeller}>{listing.account.name}</p>
                <p style={s.cardTitle}>{listing.title}</p>
                <div style={s.cardPriceRow}>
                  <span style={s.cardPrice}>{listing.offer_price.formatted}</span>
                  {listing.offer_percent > 0 && (
                    <span style={s.cardOriginal}>{listing.list_price.formatted}</span>
                  )}
                </div>
                {listing.rating_data?.rating_average > 0 && (
                  <p style={s.cardRating}>
                    ★ {listing.rating_data.rating_average.toFixed(1)}
                    <span style={s.cardRatingCount}> ({listing.rating_data.review_count})</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={s.pageBtn}
          >
            ← Prev
          </button>
          <span style={s.pageInfo}>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={s.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </Layout>
  )
}

const s: Record<string, React.CSSProperties> = {
  center: { textAlign: 'center', padding: 80, color: '#888', fontSize: 15 },
  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 24px', borderRadius: 24, fontSize: 14, zIndex: 1000 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  breadLink: { fontSize: 13, color: '#2563eb', textDecoration: 'none' },
  breadSep: { fontSize: 13, color: '#aaa' },
  breadCurrent: { fontSize: 13, color: '#555' },
  catHeader: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 },
  catImgWrap: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  catImg: { width: '100%', height: '100%', objectFit: 'cover' },
  catName: { fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 6px' },
  catDesc: { fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 },
  subCats: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  subChip: { padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e5e5', background: '#fff', fontSize: 13, color: '#333', textDecoration: 'none', fontWeight: 500 },
  statsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  countLabel: { fontSize: 14, color: '#888' },
  fetching: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', padding: '60px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textDecoration: 'none', display: 'block' },
  cardImgWrap: { position: 'relative', height: 180, background: '#f0f0f0', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', background: '#e5e5e5' },
  discountBadge: { position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 700 },
  outOfStockBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', textAlign: 'center', fontSize: 12, padding: '5px 0' },
  likeBtn: { position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' },
  cardBody: { padding: '12px 14px' },
  cardSeller: { margin: '0 0 3px', fontSize: 11, color: '#999' },
  cardTitle: { margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.3 },
  cardPriceRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardPrice: { fontSize: 15, fontWeight: 700, color: '#111' },
  cardOriginal: { fontSize: 12, color: '#aaa', textDecoration: 'line-through' },
  cardRating: { margin: 0, fontSize: 12, color: '#f59e0b', fontWeight: 600 },
  cardRatingCount: { color: '#999', fontWeight: 400 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 36 },
  pageBtn: { padding: '8px 18px', border: '1px solid #e5e5e5', background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#111' },
  pageInfo: { fontSize: 14, color: '#555' },
}
