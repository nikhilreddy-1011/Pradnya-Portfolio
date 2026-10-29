import Image from 'next/image'

import { isSvg, objectPosition } from '@/lib/media'
import type { Img } from '@/lib/types'
import { Placeholder } from './Placeholder'

type Props = {
  img: Img | null | undefined
  /** Responsive sizes hint — always set this to what the layout actually renders. */
  sizes: string
  preload?: boolean
  fit?: 'cover' | 'contain'
  kind?: 'render' | 'portrait' | 'plan' | 'texture'
  placeholderLabel?: string
  ink?: boolean
  className?: string
  /** Mobile art-direction crop, shown below 640px. */
  mobile?: Img | null
}

/**
 * The single image primitive: next/image (AVIF/WebP, srcset, lazy) with focal-point
 * cropping, a mobile crop, SVG passthrough and the placeholder system.
 * Must be placed inside a positioned box with an aspect ratio (e.g. `.frame aspect-[4/3]`).
 */
export function Picture({ img, sizes, preload, fit = 'cover', kind = 'render', placeholderLabel, ink, className = '', mobile }: Props) {
  if (!img) return <Placeholder kind={kind} label={placeholderLabel} ink={ink} className={className} />

  if (isSvg(img)) {
    // SVG (e.g. AutoCAD plan exports) — rendered via <img> so embedded scripts can never run.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.url} alt={img.alt} className={`h-full w-full object-contain ${className}`} loading={preload ? 'eager' : 'lazy'} decoding="async" />
  }

  const main = (
    <Image
      src={img.url}
      alt={img.alt}
      fill
      sizes={sizes}
      preload={preload}
      quality={82}
      className={`${mobile ? 'max-sm:hidden' : ''} ${className}`}
      style={{ objectFit: fit, objectPosition: objectPosition(img) }}
    />
  )
  if (!mobile) return main
  return (
    <>
      <Image
        src={mobile.url}
        alt={mobile.alt || img.alt}
        fill
        sizes="100vw"
        preload={preload}
        quality={80}
        className={`sm:hidden ${className}`}
        style={{ objectFit: fit, objectPosition: objectPosition(mobile) }}
      />
      {main}
    </>
  )
}
