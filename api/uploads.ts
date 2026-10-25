import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

interface SignedUpload {
  signedUrl: string
  fileUri: string
}

function safeName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40)
  const extension = (name.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? 'jpg').toLowerCase()
  return `${base || 'photo'}.${extension}`
}

async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || typeof createImageBitmap === 'undefined') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function uploadImages(files: File[], authKey: string, currency: string, language: string): Promise<string[]> {
  if (!files.length) return []
  const prepared = await Promise.all(files.map(prepareImage))
  const response = await (TradlySDK as any).app.generateS3ImageURL({
    pkKey: AppConfig.pkKey,
    authKey,
    currency,
    language,
    data: { files: prepared.map(file => ({ name: safeName(file.name), type: file.type || 'image/jpeg' })) },
  })
  const signed = response?.data?.result as SignedUpload[] | undefined
  if (response?.error || !Array.isArray(signed) || signed.length !== prepared.length) {
    throw new Error(response?.error?.message ?? 'Could not start photo upload. Please try again.')
  }
  const uploaded = await Promise.all(signed.map(async (item, index) => {
    const ok = await (TradlySDK as any).app.uploadS3Image({
      signedUrl: item.signedUrl,
      mime: prepared[index].type || 'image/jpeg',
      blob_body: prepared[index],
    })
    if (!ok) throw new Error('Photo upload failed. Please check your connection and try again.')
    return item.fileUri
  }))
  return uploaded
}
