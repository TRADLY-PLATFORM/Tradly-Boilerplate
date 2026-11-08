import { useState } from 'react'
import type { Listing } from '@/types/listing.types'
import { useDeleteBundleItemMutation, useDeleteBundlePoolItemMutation, useGetBundleItemsQuery, useGetBundlePoolQuery, useUpdateBundleItemMutation, useUpdateBundlePoolItemMutation } from '@/state/bundles/api'
import { useDeleteListingVariantMutation, useGetManageListingVariantsQuery, useUpdateListingVariantMutation } from '@/state/variants/api'
import { locale } from '@/src/components/layout/locale'

type Row = Record<string, unknown>
const rowText = (row: Row, keys: string[]) => {
  for (const key of keys) if (typeof row[key] === 'string' || typeof row[key] === 'number') return String(row[key])
  return ''
}
const rowNumber = (row: Row, keys: string[], fallback: number) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'number' || typeof value === 'string') return Number(value) || fallback
    if (value && typeof value === 'object' && 'amount' in value) return Number((value as { amount: unknown }).amount) || fallback
  }
  return fallback
}
const nestedListing = (row: Row) => {
  const listing = row.component_listing ?? row.listing
  return listing && typeof listing === 'object' ? listing as Row : {}
}

export default function ListingOptionsEditor({ listing }: { listing: Listing }) {
  const isBundle = listing.type === 'bundle'
  const supportsListingVariants = ['listings', 'rental', 'rentals'].includes(listing.order_type)
  const isVariantProduct = supportsListingVariants && !isBundle && listing.type !== 'membership' && Array.isArray(listing.variants) && listing.variants.length > 0
  const [updateBundleItem, bundleUpdate] = useUpdateBundleItemMutation()
  const [deleteBundleItem] = useDeleteBundleItemMutation()
  const [updatePoolItem, poolUpdate] = useUpdateBundlePoolItemMutation()
  const [deletePoolItem] = useDeleteBundlePoolItemMutation()
  const [updateVariant, variantUpdate] = useUpdateListingVariantMutation()
  const [deleteVariant, variantDelete] = useDeleteListingVariantMutation()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const bundleMode = listing.metadata?.bundle_mode === 'mix_match'
  const itemsQuery = useGetBundleItemsQuery(listing.id, { skip: !isBundle || bundleMode })
  const poolQuery = useGetBundlePoolQuery(listing.id, { skip: !isBundle || !bundleMode })
  const variantsQuery = useGetManageListingVariantsQuery(listing.id, { skip: !isVariantProduct })
  if (!isBundle && !isVariantProduct) return null

  const saveRow = async (event: React.FormEvent<HTMLFormElement>, row: Row, pool = false) => {
    event.preventDefault(); setNotice(''); setError('')
    const values = new FormData(event.currentTarget)
    const itemId = rowText(row, ['id', 'item_id'])
    const result = pool
      ? await updatePoolItem({ listingId: listing.id, itemId, orderBy: Number(values.get('order_by')) })
      : await updateBundleItem({ listingId: listing.id, itemId, quantity: Number(values.get('quantity')), orderBy: Number(values.get('order_by')) })
    if ('error' in result) setError(locale.labels.optionsSaveError)
    else setNotice(locale.labels.optionsSaved)
  }
  const removeRow = async (row: Row, pool = false) => {
    const name = rowText(nestedListing(row), ['title', 'name']) || locale.labels.bundleComponent
    if (!window.confirm(locale.labels.bundleRemoveConfirm.replace('{name}', name))) return
    setNotice(''); setError('')
    const itemId = rowText(row, ['id', 'item_id'])
    const result = pool ? await deletePoolItem({ listingId: listing.id, itemId }) : await deleteBundleItem({ listingId: listing.id, itemId })
    if ('error' in result) setError(locale.labels.optionsDeleteError)
    else setNotice(locale.labels.bundleItemRemoved)
  }
  const saveVariant = async (event: React.FormEvent<HTMLFormElement>, variant: Row) => {
    event.preventDefault(); setNotice(''); setError('')
    const values = new FormData(event.currentTarget)
    const id = rowText(variant, ['id', 'variant_id'])
    const result = await updateVariant({ listingId: listing.id, variantId: id, variant: { list_price: Number(values.get('list_price')), stock: Number(values.get('stock')) } })
    if ('error' in result) setError(locale.labels.optionsSaveError)
    else setNotice(locale.labels.optionsSaved)
  }
  const removeVariant = async (variant: Row) => {
    const name = rowText(variant, ['title', 'name']) || locale.labels.variant
    if (!window.confirm(locale.labels.variantRemoveConfirm.replace('{name}', name))) return
    setNotice(''); setError('')
    const result = await deleteVariant({ listingId: listing.id, variantId: rowText(variant, ['id', 'variant_id']) })
    if ('error' in result) setError(locale.labels.optionsDeleteError)
    else setNotice(locale.labels.variantRemoved)
  }

  const bundleRows: Row[] = bundleMode ? poolQuery.data?.pool ?? [] : itemsQuery.data?.items ?? []
  const busy = bundleUpdate.isLoading || poolUpdate.isLoading || variantUpdate.isLoading || variantDelete.isLoading
  return <section className="mt-5 border-t border-border pt-4">
    <h3 className="text-sm font-semibold text-foreground">{isBundle ? locale.labels.bundleManageTitle : locale.labels.variantManageTitle}</h3>
    {isBundle && (bundleMode ? poolQuery.isLoading : itemsQuery.isLoading) && <p className="mt-3 text-sm text-muted-foreground">{locale.labels.optionsLoading}</p>}
    {isVariantProduct && variantsQuery.isLoading && <p className="mt-3 text-sm text-muted-foreground">{locale.labels.optionsLoading}</p>}
    {(itemsQuery.isError && !bundleMode || poolQuery.isError && bundleMode || variantsQuery.isError && isVariantProduct) && <p role="alert" className="mt-3 text-sm text-destructive">{locale.labels.optionsLoadError}</p>}
    {isBundle && !itemsQuery.isLoading && !poolQuery.isLoading && bundleRows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{locale.labels.bundleEmpty}</p>}
    {isBundle && bundleRows.map((row, index) => {
      const child = nestedListing(row)
      return <form key={rowText(row, ['id', 'item_id']) || index} onSubmit={event => void saveRow(event, row, bundleMode)} className="mt-3 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_100px_100px_auto] sm:items-end"><div><p className="text-sm font-medium text-foreground">{rowText(child, ['title', 'name']) || rowText(row, ['title', 'name']) || locale.labels.bundleComponent}</p><p className="text-xs text-muted-foreground">{bundleMode ? locale.labels.bundleChoice : locale.labels.bundleQuantity}</p></div>{!bundleMode && <label className="text-xs text-muted-foreground">{locale.labels.quantity}<input type="number" min="1" name="quantity" defaultValue={rowNumber(row, ['quantity'], 1)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground" /></label>}<label className="text-xs text-muted-foreground">{locale.labels.displayOrder}<input type="number" min="0" name="order_by" defaultValue={rowNumber(row, ['order_by', 'order'], index)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground" /></label><div className="flex gap-2"><button disabled={busy} className="rounded border border-border px-3 py-2 text-xs">{locale.labels.save}</button><button type="button" disabled={busy} onClick={() => void removeRow(row, bundleMode)} className="rounded border border-destructive/40 px-3 py-2 text-xs text-destructive">{locale.labels.remove}</button></div></form>
    })}
    {isVariantProduct && !variantsQuery.isLoading && (variantsQuery.data ?? []).length === 0 && <p className="mt-3 text-sm text-muted-foreground">{locale.labels.variantsEmpty}</p>}
    {isVariantProduct && (variantsQuery.data ?? []).map((variant, index) => <form key={variant.id ?? index} onSubmit={event => void saveVariant(event, variant as unknown as Row)} className="mt-3 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_110px_100px_auto] sm:items-end"><div><p className="text-sm font-medium text-foreground">{variant.title}</p><p className="mt-1 text-xs text-muted-foreground">{variant.active ? locale.labels.active : locale.labels.inactive}</p></div><label className="text-xs text-muted-foreground">{locale.labels.price}<input required type="number" min="0" step="0.01" name="list_price" defaultValue={rowNumber(variant as unknown as Row, ['list_price'], 0)} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground" /></label><label className="text-xs text-muted-foreground">{locale.labels.stock}<input required type="number" min="0" step="1" name="stock" defaultValue={variant.stock} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground" /></label><div className="flex gap-2"><button disabled={busy} className="rounded border border-border px-3 py-2 text-xs">{locale.labels.save}</button><button type="button" disabled={busy} onClick={() => void removeVariant(variant as unknown as Row)} className="rounded border border-destructive/40 px-3 py-2 text-xs text-destructive">{locale.labels.remove}</button></div></form>)}
    {(notice || error) && <p role={error ? 'alert' : 'status'} className={`mt-3 rounded-lg p-3 text-sm ${error ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>{error || notice}</p>}
  </section>
}
