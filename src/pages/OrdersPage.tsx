import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetOrdersQuery } from '@/state/orders/api'
import Layout from '../components/Layout'
import type { Order } from '@/types/order.types'

const STATUS_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#fef9c3', color: '#854d0e' },
  2: { bg: '#dbeafe', color: '#1e40af' },
  3: { bg: '#e0f2fe', color: '#0369a1' },
  4: { bg: '#ede9fe', color: '#6d28d9' },
  5: { bg: '#ede9fe', color: '#6d28d9' },
  6: { bg: '#dcfce7', color: '#15803d' },
  7: { bg: '#dcfce7', color: '#15803d' },
  8: { bg: '#fee2e2', color: '#b91c1c' },
  9: { bg: '#f3f4f6', color: '#374151' },
  10: { bg: '#fee2e2', color: '#b91c1c' },
}
const STATUS_LABEL: Record<number, string> = {
  1: 'Pending', 2: 'Confirmed', 3: 'Processing', 4: 'Ready to ship',
  5: 'Shipped', 6: 'Delivered', 7: 'Completed', 8: 'Cancelled',
  9: 'Refunded', 10: 'Failed',
}

function StatusBadge({ status }: { status: number }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ ...s.badge, background: c.bg, color: c.color }}>
      {STATUS_LABEL[status] ?? `Status ${status}`}
    </span>
  )
}

function OrderCard({ order }: { order: any }) {
  const items: any[] = order.order_details ?? []
  const firstItem = items[0]
  const extraCount = Math.max(0, items.length - 1)
  const grandTotal = order.grand_total ?? order.offer_total

  return (
    <Link to={`/orders/${order.id}`} style={s.orderCard}>
      {/* Thumbnail */}
      <div style={s.thumbWrap}>
        {firstItem?.listing?.images?.[0]
          ? <img src={firstItem.listing.images[0]} alt={firstItem.listing.title} style={s.thumb} />
          : <div style={s.thumbPlaceholder} />
        }
        {extraCount > 0 && <div style={s.extraBadge}>+{extraCount}</div>}
      </div>

      {/* Info */}
      <div style={s.orderInfo}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <p style={s.orderRef}>#{order.order_reference}</p>
          <StatusBadge status={order.order_status} />
        </div>
        <p style={s.orderMeta}>
          {firstItem?.listing?.title ?? `Order #${order.reference_number}`}
          {extraCount > 0 ? ` + ${extraCount} more` : ''}
        </p>
        <div style={s.orderFooter}>
          <span style={s.orderDate}>
            {new Date(order.created_at * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <span style={s.orderTotal}>{grandTotal?.formatted ?? '—'}</span>
        </div>
      </div>
    </Link>
  )
}

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, isFetching } = useGetOrdersQuery({ page, limit: 20 })

  const orders = data?.orders ?? []
  const totalPages = Math.ceil((data?.total_records ?? 0) / 20)

  if (isLoading) return <Layout><div style={s.center}>Loading orders…</div></Layout>
  if (isError) return <Layout><div style={s.errMsg}>Failed to load orders.</div></Layout>

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={s.pageTitle}>My orders</h1>
        {isFetching && <span style={s.fetching}>Refreshing…</span>}
      </div>

      {orders.length === 0 ? (
        <div style={s.emptyState}>
          <p style={{ fontSize: 16, color: '#888', marginBottom: 20 }}>No orders yet.</p>
          <Link to="/" style={s.shopBtn}>Browse listings</Link>
        </div>
      ) : (
        <>
          <div style={s.list}>
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>

          {totalPages > 1 && (
            <div style={s.pagination}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} style={s.pageBtn}>← Prev</button>
              <span style={s.pageInfo}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={s.pageBtn}>Next →</button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}

const s: Record<string, React.CSSProperties> = {
  center: { textAlign: 'center', padding: 80, color: '#888', fontSize: 15 },
  errMsg: { textAlign: 'center', padding: 80, color: '#b91c1c', fontSize: 14 },
  pageTitle: { fontSize: 26, fontWeight: 700, color: '#111', margin: 0 },
  fetching: { fontSize: 13, color: '#888' },
  emptyState: { textAlign: 'center', padding: '60px 0' },
  shopBtn: { display: 'inline-block', padding: '12px 28px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  orderCard: { background: '#fff', borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textDecoration: 'none', transition: 'box-shadow 0.15s' },
  thumbWrap: { position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPlaceholder: { width: '100%', height: '100%', background: '#e5e5e5' },
  extraBadge: { position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, borderRadius: 4, padding: '1px 5px', fontWeight: 700 },
  orderInfo: { flex: 1, minWidth: 0 },
  orderRef: { margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#111' },
  orderMeta: { margin: '0 0 10px', fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 12, color: '#888' },
  orderTotal: { fontSize: 14, fontWeight: 700, color: '#111' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 },
  pageBtn: { padding: '8px 18px', border: '1px solid #e5e5e5', background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#111' },
  pageInfo: { fontSize: 14, color: '#555' },
}
