import type { PanoramaSource } from '@/lib/types'

/**
 * Choose which resolution to download: the largest that fits this device's texture budget —
 * the GPU's MAX_TEXTURE_SIZE, and 4096 px on phones / low-memory devices (an 8K texture is
 * ~180 MB of GPU memory with mipmaps). If nothing fits, take the smallest and downscale it
 * while decoding, so an oversized master never breaks the viewer.
 */
export function planPanoramaLoad(sources: PanoramaSource[], maxTextureSize: number, constrained: boolean) {
  const budget = Math.min(maxTextureSize || 4096, constrained ? 4096 : 8192)
  const sorted = [...sources].sort((a, b) => (a.width ?? Infinity) - (b.width ?? Infinity))
  const fits = sorted.filter((s) => s.width !== undefined && s.width <= budget)
  return { source: fits.length ? fits[fits.length - 1] : sorted[0], maxDim: budget }
}
