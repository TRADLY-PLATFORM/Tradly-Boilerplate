import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { uploadImages } from '@/api/uploads'
import { getThrownErrorMessage } from '@/state/api-response'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

export const uploadsApi = createApi({
  reducerPath: 'uploadsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: builder => ({
    uploadImages: builder.mutation<string[], File[]>({
      queryFn: async (files, { getState }) => {
        const state = getState() as LocalState
        try {
          return { data: await uploadImages(files, state.auth.authKey, state.app.currency, state.app.language) }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: getThrownErrorMessage(error, 'Could not upload photos') } }
        }
      },
    }),
  }),
})

export const { useUploadImagesMutation } = uploadsApi
