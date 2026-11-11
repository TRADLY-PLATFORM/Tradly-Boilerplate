import type { Listing } from '@/types/listing.types'

/**
 * What a listing plays. A creator adds the file or link to the listing in Tradly (its video, or a text field). We look,
 * in order, at: the listing's `videos`, then `metadata` (`video_url`, `audio_url`, `media_url`, `preview_url`), then a
 * listing field whose name says video, audio, media, preview, episode, track or sample and whose value is a link.
 * - `video` / `audio`: a direct file link, played with the browser's own player (mp4, webm, mov, m3u8 in Safari; mp3, m4a, wav, ogg).
 * - `embed`: a YouTube or Vimeo link, shown in their player.
 * - `none`: nothing to play (the listing page shows its pictures and text as usual).
 */
export type Media = { kind: 'video' | 'audio'; src: string } | { kind: 'embed'; src: string } | { kind: 'none'; src: '' }

const AUDIO = /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus)(\?|#|$)/i
const VIDEO = /\.(mp4|webm|mov|m4v|ogv|m3u8)(\?|#|$)/i

export function embedUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (host === 'vimeo.com' && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video/${u.pathname.split('/')[1]}`
    if (host === 'player.vimeo.com') return url
  } catch { /* not a link */ }
  return ''
}

const classify = (url: string): Media => {
  const link = url.trim()
  if (!/^https?:\/\//i.test(link)) return { kind: 'none', src: '' }
  const embed = embedUrl(link)
  if (embed) return { kind: 'embed', src: embed }
  if (AUDIO.test(link)) return { kind: 'audio', src: link }
  if (VIDEO.test(link)) return { kind: 'video', src: link }
  return { kind: 'none', src: '' }
}

const text = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    for (const key of ['value', 'name', 'url']) if (typeof v[key] === 'string') return v[key] as string
  }
  return ''
}

export function getMedia(listing: Pick<Listing, 'videos' | 'metadata' | 'attributes'> | undefined | null): Media {
  if (!listing) return { kind: 'none', src: '' }
  for (const url of listing.videos ?? []) {
    const media = classify(text(url))
    if (media.kind !== 'none') return media
    // A hosted video file whose link has no extension is still a video.
    if (/^https?:\/\//i.test(text(url))) return { kind: 'video', src: text(url) }
  }
  const meta = (listing.metadata ?? {}) as Record<string, unknown>
  for (const key of ['video_url', 'audio_url', 'media_url', 'preview_url']) {
    const media = classify(text(meta[key]))
    if (media.kind !== 'none') return media
  }
  for (const attribute of listing.attributes ?? []) {
    if (!/video|audio|media|preview|episode|track|sample/i.test(attribute.name ?? '')) continue
    for (const value of attribute.values ?? []) {
      const media = classify(text(value))
      if (media.kind !== 'none') return media
    }
  }
  return { kind: 'none', src: '' }
}

/** A listing's plain description (the API sends HTML). */
export const plainText = (html: string | undefined): string => (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
