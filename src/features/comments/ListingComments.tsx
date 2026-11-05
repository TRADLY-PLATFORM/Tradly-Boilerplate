import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSelector } from '@/state/auth/selectors'
import { useCreateCommentMutation, useDeleteCommentLikeMutation, useDeleteCommentMutation, useDeleteCommentDislikeMutation, useDislikeCommentMutation, useEditCommentMutation, useGetCommentsQuery, useLikeCommentMutation } from '@/state/comments/api'
import { locale } from '@/src/components/layout/locale'

type Comment = Record<string, unknown>
const records = (data: Record<string, unknown> | undefined): Comment[] => {
  if (!data) return []
  for (const key of ['comments', 'items']) if (Array.isArray(data[key])) return data[key] as Comment[]
  return []
}
const value = (record: Comment, keys: string[], fallback = '') => {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key])
  return fallback
}

export default function ListingComments({ listingId }: { listingId: number | string }) {
  const isAuthenticated = useAuthSelector(state => state.isAuthenticated)
  const userId = useAuthSelector(state => state.userId)
  const { data, isLoading, isError } = useGetCommentsQuery({ reference_id: listingId, reference_type: 'listings_comments', page: 1 }, { skip: !listingId })
  const [createComment, createState] = useCreateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [likeComment] = useLikeCommentMutation()
  const [removeLike] = useDeleteCommentLikeMutation()
  const [dislikeComment] = useDislikeCommentMutation()
  const [removeDislike] = useDeleteCommentDislikeMutation()
  const [editComment, editState] = useEditCommentMutation()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [replying, setReplying] = useState<string | null>(null)
  const comments = records(data)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const form = event.currentTarget
    const values = new FormData(form)
    const message = String(values.get('message') ?? '').trim()
    if (!message) return
    const result = await createComment({ reference_id: listingId, reference_type: 'listings_comments', message })
    if ('error' in result) setError(locale.labels.commentError)
    else form.reset()
  }
  const submitEdit = async (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault(); setError('')
    const form = event.currentTarget
    const message = String(new FormData(form).get('message') ?? '').trim()
    const result = await editComment({ commentId: id, input: { message } })
    if ('error' in result) setError(locale.labels.commentError)
    else setEditing(null)
  }
  const submitReply = async (event: React.FormEvent<HTMLFormElement>, parent: string) => {
    event.preventDefault(); setError('')
    const form = event.currentTarget
    const message = String(new FormData(form).get('message') ?? '').trim()
    const result = await createComment({ reference_id: listingId, reference_type: 'listings_comments', parent, message })
    if ('error' in result) setError(locale.labels.commentError)
    else { form.reset(); setReplying(null) }
  }
  return <section className="mt-8 border-t border-border pt-8" aria-labelledby="comments-title">
    <h2 id="comments-title" className="font-display text-xl font-bold text-foreground">{locale.labels.comments}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{locale.labels.commentsDescription}</p>
    {isLoading && <p className="mt-4 text-sm text-muted-foreground">{locale.labels.commentsLoading}</p>}
    {isError && <p role="alert" className="mt-4 text-sm text-destructive">{locale.labels.commentsLoadError}</p>}
    {!isLoading && !isError && !comments.length && <p className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{locale.labels.commentsEmpty}</p>}
    {!!comments.length && <div className="mt-4 space-y-3">{comments.map((comment, index) => {
      const id = value(comment, ['id', 'comment_id'])
      const owner = value(comment, ['user_id', 'created_by', 'author_id'])
      const ownComment = userId != null && owner === String(userId)
      const replies = Array.isArray(comment.replies) ? comment.replies as Comment[] : []
      const liked = comment.liked === true || comment.liked === 1
      const unliked = comment.unliked === true || comment.unliked === 1
      return <article key={id || index} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><strong className="text-sm text-foreground">{value(comment, ['user_name', 'name', 'author'], locale.labels.customer)}</strong></div>{editing === id ? <form onSubmit={event => void submitEdit(event, id)} className="mt-3 space-y-2"><textarea name="message" defaultValue={value(comment, ['message', 'comment', 'content'])} required rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /><div className="flex gap-3"><button disabled={editState.isLoading} className="text-xs underline">{locale.labels.save}</button><button type="button" onClick={() => setEditing(null)} className="text-xs underline">{locale.labels.cancel}</button></div></form> : <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{value(comment, ['message', 'comment', 'content'])}</p>}<div className="mt-3 flex flex-wrap gap-4"><button type="button" onClick={() => void (liked ? removeLike(id) : likeComment(id))} className="text-xs text-muted-foreground underline">{liked ? locale.labels.commentUnlike : locale.labels.commentLike}</button><button type="button" onClick={() => void (unliked ? removeDislike(id) : dislikeComment(id))} className="text-xs text-muted-foreground underline">{unliked ? locale.labels.commentRemoveDislike : locale.labels.commentDislike}</button>{isAuthenticated && <button type="button" onClick={() => setReplying(replying === id ? null : id)} className="text-xs text-muted-foreground underline">{locale.labels.commentReply}</button>}{ownComment && <><button type="button" onClick={() => setEditing(id)} className="text-xs text-muted-foreground underline">{locale.labels.edit}</button><button type="button" onClick={() => { if (window.confirm(locale.labels.commentDeleteConfirm)) void deleteComment(id) }} className="text-xs text-destructive underline">{locale.labels.delete}</button></>}</div>{replies.length > 0 && <div className="mt-4 space-y-3 border-s-2 border-border ps-4">{replies.map((reply, replyIndex) => <div key={value(reply, ['id', 'comment_id']) || replyIndex}><strong className="text-xs text-foreground">{value(reply, ['user_name', 'name', 'author'], locale.labels.customer)}</strong><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{value(reply, ['message', 'comment', 'content'])}</p></div>)}</div>}{replying === id && <form onSubmit={event => void submitReply(event, id)} className="mt-3 space-y-2"><textarea name="message" required rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" aria-label={locale.labels.commentReply} /><button disabled={createState.isLoading} className="rounded border border-border px-3 py-1.5 text-xs">{locale.labels.commentSubmit}</button></form>}</article>
    })}</div>}
    {isAuthenticated ? <form onSubmit={event => void submit(event)} className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4"><label className="block text-sm font-medium text-foreground">{locale.labels.commentAdd}<textarea name="message" required maxLength={5000} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={createState.isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{createState.isLoading ? locale.labels.commentSubmitting : locale.labels.commentSubmit}</button></form> : <p className="mt-4 text-sm text-muted-foreground">{locale.labels.commentSignIn} <Link className="underline" to={`/sign-in?next=${encodeURIComponent(window.location.pathname)}`}>{locale.labels.signIn}</Link></p>}
  </section>
}
