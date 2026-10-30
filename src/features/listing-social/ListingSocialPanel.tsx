import { useState } from 'react'
import { useAuthSelector } from '@/state/auth/selectors'
import { useCreateNegotiationMutation } from '@/state/negotiations/api'
import { useCreateReviewMutation, useGetReviewsQuery, useSetReviewReactionMutation } from '@/state/reviews/api'

type Review = Record<string, unknown>
const records = (data: Record<string, unknown> | undefined): Review[] => {
  if (!data) return []
  for (const key of ['reviews', 'items']) if (Array.isArray(data[key])) return data[key] as Review[]
  return []
}
const textValue = (item: Review, keys: string[], fallback: string) => {
  for (const key of keys) if (typeof item[key] === 'string' || typeof item[key] === 'number') return String(item[key])
  return fallback
}

export default function ListingSocialPanel({ listingId }: { listingId: number }) {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const { data } = useGetReviewsQuery({ listing_id: listingId, page: 1 }, { skip: !listingId })
  const [createReview, reviewState] = useCreateReviewMutation()
  const [reactToReview, reactionState] = useSetReviewReactionMutation()
  const [createOffer, offerState] = useCreateNegotiationMutation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const reviews = records(data)

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(''); setError('')
    const form = event.currentTarget
    const fields = new FormData(form)
    const result = await createReview({ listing_id: listingId, rating: Number(fields.get('rating')), comment: String(fields.get('comment') ?? '').trim() })
    if ('error' in result) setError('Could not submit your review. Please try again.')
    else { form.reset(); setMessage('Your review was submitted.') }
  }

  const submitOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(''); setError('')
    const form = event.currentTarget
    const fields = new FormData(form)
    const result = await createOffer({ listingId, offer: { price: Number(fields.get('price')) } })
    if ('error' in result) setError('Could not send your offer. Please try again.')
    else { form.reset(); setMessage('Your offer was sent.') }
  }

  return <section className="mt-10 grid gap-6 border-t border-border pt-8 lg:grid-cols-2">
    <div className="space-y-4">
      <div><h2 className="font-display text-xl font-bold text-foreground">Reviews</h2><p className="mt-1 text-sm text-muted-foreground">Feedback from marketplace customers.</p></div>
      {reviews.length ? <div className="space-y-3">{reviews.map((review, index) => <article key={textValue(review, ['id'], `review-${index}`)} className="rounded-xl border border-border bg-card p-4"><div className="flex justify-between gap-3"><strong className="text-sm text-foreground">{textValue(review, ['user_name', 'name', 'author'], 'Customer')}</strong><span className="text-sm text-muted-foreground">{textValue(review, ['rating', 'score'], '')} ★</span></div><p className="mt-2 text-sm text-muted-foreground">{textValue(review, ['comment', 'review', 'content'], '')}</p><div className="mt-3 flex gap-3"><button disabled={!isAuthenticated || reactionState.isLoading} onClick={() => void reactToReview({ reviewId: textValue(review, ['id'], ''), status: 1 })} className="text-xs text-muted-foreground underline disabled:opacity-50">Helpful</button><button disabled={!isAuthenticated || reactionState.isLoading} onClick={() => void reactToReview({ reviewId: textValue(review, ['id'], ''), status: 2 })} className="text-xs text-muted-foreground underline disabled:opacity-50">Not helpful</button></div></article>)}</div> : <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No reviews yet.</p>}
      {isAuthenticated ? <form onSubmit={event => void submitReview(event)} className="space-y-3 rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold text-foreground">Write a review</h3><label className="block text-sm">Rating<select name="rating" defaultValue="5" className="ms-2 rounded-md border border-input bg-background px-2 py-1">{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}</select></label><label className="block text-sm">Your review<textarea name="comment" required rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label><button disabled={reviewState.isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{reviewState.isLoading ? 'Submitting…' : 'Submit review'}</button></form> : <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>}
    </div>
    <div className="space-y-4"><div><h2 className="font-display text-xl font-bold text-foreground">Make an offer</h2><p className="mt-1 text-sm text-muted-foreground">Send the seller a price proposal for this listing.</p></div>{isAuthenticated ? <form onSubmit={event => void submitOffer(event)} className="space-y-3 rounded-xl border border-border bg-card p-4"><label className="block text-sm font-medium">Your offer<input name="price" type="number" min="0.01" step="0.01" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label><button disabled={offerState.isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{offerState.isLoading ? 'Sending…' : 'Send offer'}</button></form> : <p className="text-sm text-muted-foreground">Sign in to make an offer.</p>}</div>
    {(message || error) && <p className={`lg:col-span-2 rounded-lg p-3 text-sm ${error ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`} role={error ? 'alert' : 'status'}>{error || message}</p>}
  </section>
}
