import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as commentsAPI from '@/api/comments'
import type { CreateCommentInput, EditCommentInput, GetCommentsParams, TradlyId, TradlyRecord } from '@/types/prompt-apis.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })
const custom = (message: string) => ({ status: 'CUSTOM_ERROR', error: message } as const)
const request = async (operation: Promise<unknown>, fallback: string): Promise<{ data: TradlyRecord } | { error: ReturnType<typeof custom> }> => {
  try { const result: any = normalizeTradlyResponse(await operation, fallback); return result.error ? { error: custom(result.error.message ?? fallback) } : { data: (result.data ?? {}) as TradlyRecord } }
  catch (cause) { return { error: custom(cause instanceof Error ? cause.message : fallback) } }
}

export const commentsApi = createApi({
  reducerPath: 'commentsApi', baseQuery: fetchBaseQuery({ baseUrl: '/' }), tagTypes: ['Comment'],
  endpoints: builder => ({
    getComments: builder.query<TradlyRecord, GetCommentsParams>({ queryFn: (params, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.getComments(params, c.authKey, c.currency, c.language), 'Could not load comments') }, providesTags: ['Comment'] }),
    getCommentDetail: builder.query<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.getCommentDetail(id, c.authKey, c.currency, c.language), 'Could not load comment') }, providesTags: (_r, _e, id) => [{ type: 'Comment', id: String(id) }] }),
    createComment: builder.mutation<TradlyRecord, CreateCommentInput>({ queryFn: (input, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.createComment(input, c.authKey, c.currency, c.language), 'Could not create comment') }, invalidatesTags: ['Comment'] }),
    editComment: builder.mutation<TradlyRecord, { commentId: TradlyId; input: EditCommentInput }>({ queryFn: ({ commentId, input }, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.editComment(commentId, input, c.authKey, c.currency, c.language), 'Could not edit comment') }, invalidatesTags: (_r, _e, { commentId }) => [{ type: 'Comment', id: String(commentId) }, 'Comment'] }),
    deleteComment: builder.mutation<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.deleteComment(id, c.authKey, c.currency, c.language), 'Could not delete comment') }, invalidatesTags: ['Comment'] }),
    likeComment: builder.mutation<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.likeComment(id, c.authKey, c.currency, c.language), 'Could not like comment') }, invalidatesTags: (_r, _e, id) => [{ type: 'Comment', id: String(id) }, 'Comment'] }),
    deleteCommentLike: builder.mutation<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.deleteCommentLike(id, c.authKey, c.currency, c.language), 'Could not remove comment like') }, invalidatesTags: (_r, _e, id) => [{ type: 'Comment', id: String(id) }, 'Comment'] }),
    dislikeComment: builder.mutation<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.dislikeComment(id, c.authKey, c.currency, c.language), 'Could not dislike comment') }, invalidatesTags: (_r, _e, id) => [{ type: 'Comment', id: String(id) }, 'Comment'] }),
    deleteCommentDislike: builder.mutation<TradlyRecord, TradlyId>({ queryFn: (id, { getState }) => { const c = context(getState() as LocalState); return request(commentsAPI.deleteCommentDislike(id, c.authKey, c.currency, c.language), 'Could not remove comment dislike') }, invalidatesTags: (_r, _e, id) => [{ type: 'Comment', id: String(id) }, 'Comment'] }),
  }),
})
export const { useGetCommentsQuery, useGetCommentDetailQuery, useCreateCommentMutation, useEditCommentMutation, useDeleteCommentMutation, useLikeCommentMutation, useDeleteCommentLikeMutation, useDislikeCommentMutation, useDeleteCommentDislikeMutation } = commentsApi
