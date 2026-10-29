// Checked once per session; the probe context is released straight away, because browsers
// cap live WebGL contexts (~16) and silently kill the oldest — which could be a live viewer.
export type WebGLCaps = { supported: boolean; maxTextureSize: number }

let caps: WebGLCaps | null = null

export function getWebGLCaps(): WebGLCaps {
  if (caps) return caps
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    caps = gl
      ? { supported: true, maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 4096 }
      : { supported: false, maxTextureSize: 0 }
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    caps = { supported: false, maxTextureSize: 0 }
  }
  return caps
}

export function hasWebGL() {
  return getWebGLCaps().supported
}
