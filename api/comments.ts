import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'
import type { CreateCommentInput, EditCommentInput, GetCommentsParams } from '@/types/prompt-apis.types'

const call = (path: string, Method: string, authKey: string, currency: string, language: string, data?: unknown, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(data !== undefined ? { data } : {}), ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getComments = (params: GetCommentsParams, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/comments', 'GET', authKey, currency, language, undefined, params as unknown as Record<string, unknown>)

export const getCommentDetail = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}`, 'GET', authKey, currency, language)

export const createComment = (comment: CreateCommentInput, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/comments', 'POST', authKey, currency, language, { comment })

export const editComment = (commentId: number | string, comment: EditCommentInput, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}`, 'PUT', authKey, currency, language, { comment })

export const deleteComment = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}`, 'DELETE', authKey, currency, language)

export const likeComment = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}/likes`, 'POST', authKey, currency, language)

export const deleteCommentLike = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}/likes`, 'DELETE', authKey, currency, language)

export const dislikeComment = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}/unlikes`, 'POST', authKey, currency, language)

export const deleteCommentDislike = (commentId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/comments/${commentId}/unlikes`, 'DELETE', authKey, currency, language)
