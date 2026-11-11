import test from 'node:test'
import assert from 'node:assert/strict'
import { getMedia, embedUrl, plainText } from '../src/features/media/media.ts'

test('a listing video file plays as video, an audio file as audio', () => {
  assert.deepEqual(getMedia({ videos: ['https://cdn.example/a.mp4'] }), { kind: 'video', src: 'https://cdn.example/a.mp4' })
  assert.deepEqual(getMedia({ videos: ['https://cdn.example/ep1.mp3?x=1'] }), { kind: 'audio', src: 'https://cdn.example/ep1.mp3?x=1' })
})

test('YouTube and Vimeo links become embeds', () => {
  assert.equal(embedUrl('https://www.youtube.com/watch?v=abc123'), 'https://www.youtube.com/embed/abc123')
  assert.equal(embedUrl('https://youtu.be/abc123'), 'https://www.youtube.com/embed/abc123')
  assert.equal(embedUrl('https://vimeo.com/76979871'), 'https://player.vimeo.com/video/76979871')
  assert.equal(embedUrl('https://example.com/watch?v=1'), '')
  assert.deepEqual(getMedia({ videos: ['https://youtu.be/abc123'] }), { kind: 'embed', src: 'https://www.youtube.com/embed/abc123' })
})

test('falls back to metadata, then to a listing field named like media', () => {
  assert.deepEqual(getMedia({ videos: [], metadata: { audio_url: 'https://cdn.example/t.m4a' } }), { kind: 'audio', src: 'https://cdn.example/t.m4a' })
  assert.deepEqual(getMedia({ videos: [], metadata: {}, attributes: [{ name: 'Audio preview', values: [{ value: 'https://cdn.example/p.mp3' }] }] }), { kind: 'audio', src: 'https://cdn.example/p.mp3' })
  assert.equal(getMedia({ videos: [], metadata: {}, attributes: [{ name: 'Colour', values: ['https://x.example/a.mp3'] }] }).kind, 'none')
})

test('nothing to play, or not a link, is none', () => {
  assert.equal(getMedia(undefined).kind, 'none')
  assert.equal(getMedia({ videos: [], metadata: { video_url: 'javascript:alert(1)' } }).kind, 'none')
  assert.equal(embedUrl('not a url'), '')
})

test('a hosted video link without an extension still plays as video', () => {
  assert.deepEqual(getMedia({ videos: ['https://media.tradly.app/videos/12345'] }), { kind: 'video', src: 'https://media.tradly.app/videos/12345' })
})

test('plainText strips tags', () => {
  assert.equal(plainText('<p>Hello <b>world</b></p>'), 'Hello world')
})
