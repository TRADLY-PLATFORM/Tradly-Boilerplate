import { useEffect, useRef, useState } from 'react'
import { heroMedia } from '@/src/config/heroMedia'

type Props = { videoUrl?: string; posterUrl?: string; className?: string }

/** "148 36% 17%" (the palette's HSL triples) to 0..1 rgb. */
function hslTripleToRgb(triple: string): [number, number, number] | null {
  const m = triple.trim().match(/^(-?[\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/)
  if (!m) return null
  const h = (((Number(m[1]) % 360) + 360) % 360) / 360
  const s = Number(m[2]) / 100
  const l = Number(m[3]) / 100
  const k = (n: number) => (n + h * 12) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/** The hero's two colours from the palette (--hero-from / --hero-to, else the warm and secondary tokens). */
function heroColours(): [[number, number, number], [number, number, number]] {
  const css = getComputedStyle(document.documentElement)
  const read = (names: string[], fallback: [number, number, number]) => {
    for (const name of names) {
      const rgb = hslTripleToRgb(css.getPropertyValue(name))
      if (rgb) return rgb
    }
    return fallback
  }
  return [read(['--hero-from', '--coffee-warm'], [0.2, 0.3, 0.25]), read(['--hero-to', '--coffee-secondary'], [0.35, 0.45, 0.4])]
}

const VERTEX = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`

// Slow overlapping waves blended between the two palette colours, with a faint moving highlight. Cheap on purpose.
const FRAGMENT = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.12;
  float w = sin(uv.x * 3.0 + t * 2.0) * 0.5 + sin(uv.y * 4.0 - t * 1.5) * 0.5 + sin((uv.x + uv.y) * 5.0 + t * 3.0) * 0.35;
  vec3 c = mix(uA, uB, smoothstep(-1.0, 1.0, w));
  float h = pow(max(0.0, sin(uv.x * 6.0 + t * 4.0) * sin(uv.y * 5.0 - t * 3.0)), 6.0) * 0.08;
  o = vec4(c + h, 1.0);
}`

/** Draws the animation on `canvas`; returns a stop function, or null when WebGL2 is not available. */
function startShader(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) return null
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
    console.warn('HeroMedia: shader did not compile', gl.getShaderInfoLog(shader))
    return null
  }
  const vs = compile(gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('HeroMedia: shader program did not link', gl.getProgramInfoLog(program))
    return null
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const [a, b] = heroColours()
  gl.uniform3f(gl.getUniformLocation(program, 'uA'), a[0], a[1], a[2])
  gl.uniform3f(gl.getUniformLocation(program, 'uB'), b[0], b[1], b[2])

  // Half resolution: a soft gradient does not need more, and it keeps the cost low.
  const resize = () => {
    const width = Math.max(2, Math.round(canvas.clientWidth / 2))
    const height = Math.max(2, Math.round(canvas.clientHeight / 2))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    gl.uniform2f(uRes, width, height)
  }

  let frame = 0
  let visible = true
  const began = performance.now()
  const draw = () => {
    frame = 0
    if (!visible || document.hidden) return
    resize()
    gl.uniform1f(uTime, (performance.now() - began) / 1000)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    frame = requestAnimationFrame(draw)
  }
  const kick = () => { if (!frame) frame = requestAnimationFrame(draw) }
  // Stop drawing when the hero is off screen or the tab is hidden.
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); if (visible) kick() })
  observer.observe(canvas)
  document.addEventListener('visibilitychange', kick)
  canvas.addEventListener('webglcontextlost', event => event.preventDefault())
  kick()

  return () => {
    if (frame) cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener('visibilitychange', kick)
  }
}

/**
 * Moving background for the home hero. Put it in the `hero-media` slot: `<HeroMedia />`.
 * Video (config/heroMedia.ts or the props) when there is one, otherwise a soft WebGL2 animation in the palette's
 * hero colours. People who prefer reduced motion, data-saver users and browsers without WebGL2 get the still
 * poster (or the plain gradient). Decorative only: hidden from screen readers.
 */
export default function HeroMedia({ videoUrl = heroMedia.videoUrl, posterUrl = heroMedia.posterUrl, className = '' }: Props) {
  // No video or picture configured: the hero stays a flat colour (no generated gradient animation).
  if (!videoUrl && !posterUrl) return null
  return <HeroMediaPlayer videoUrl={videoUrl} posterUrl={posterUrl} className={className} />
}

function HeroMediaPlayer({ videoUrl = '', posterUrl = '', className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [still, setStill] = useState(false)

  const calm = typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true)
  const small = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  const playVideo = !!videoUrl && !calm && !small

  useEffect(() => {
    if (playVideo || calm || !canvasRef.current) return
    const stop = startShader(canvasRef.current)
    if (!stop) setStill(true)
    return stop ?? undefined
  }, [playVideo, calm])

  const poster = posterUrl ? <img src={posterUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /> : null

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {playVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={videoUrl} poster={posterUrl || undefined} autoPlay muted loop playsInline preload="metadata" />
      ) : calm || small || still ? (
        poster
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
      <div className="absolute inset-0 bg-black/25" />
    </div>
  )
}
