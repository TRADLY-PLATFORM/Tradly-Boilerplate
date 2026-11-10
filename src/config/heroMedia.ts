/**
 * Optional media behind the home hero (`<HeroMedia />`).
 * - `videoUrl`: a short, muted, looping video (an .mp4 or .webm link). Keep it small (a few MB, 10 to 20 seconds).
 * - `posterUrl`: the picture shown while the video loads, and kept as the still on phones, on data-saver and for
 *   people who asked their device to reduce motion.
 * With no `videoUrl` the hero shows a soft animated WebGL2 background in the palette's hero colours; browsers
 * without WebGL2 (or with reduced motion) get the plain gradient.
 */
export const heroMedia: { videoUrl: string; posterUrl: string } = {
  videoUrl: '',
  posterUrl: '',
}
