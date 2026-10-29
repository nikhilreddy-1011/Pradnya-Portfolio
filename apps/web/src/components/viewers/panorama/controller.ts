/**
 * Camera state + input handling for the 360° viewer — plain TypeScript, no React, no three.js.
 *
 * The wrapper (Panorama360Viewer) feeds it DOM input; the canvas (PanoramaCanvas) calls
 * `update(dt)` once per rendered frame and applies `yaw / pitch / fov` to the camera.
 * Rendering is on demand: the controller calls `wake()` whenever something starts moving,
 * and `update()` returns false once everything has settled, so an idle viewer draws nothing.
 *
 * Angles are in degrees.
 *   yaw   0 = left edge of the equirectangular image, 180 = its centre; increasing = turning right
 *   pitch 0 = horizon, positive = looking up
 *   fov   vertical field of view (PerspectiveCamera.fov)
 *
 * The camera never moves: it sits at the centre of the panorama sphere. Everything here —
 * cursor-follow, drag, keys, reset — changes only yaw and pitch (direction); zoom changes only
 * the field of view. There is no roll.
 *
 * Field of view (the main lever on how "natural" a panorama looks):
 *   default   62° vertical, but never wider than 92° horizontally (≈ a 20 mm lens on full frame),
 *             70° vertical on portrait screens. Wider rectilinear views stretch the edges.
 *   zoom-out  at most 75° vertical / 100° horizontal.
 *   zoom-in   limited by the panorama's real resolution: stop when one texel would cover more
 *             than MAX_MAGNIFICATION screen pixels (so a 1774 px panorama barely zooms, an
 *             8192 px master allows ~3×). Always at least 1.3×.
 */

export type PanoramaOptions = {
  initialYaw: number
  initialPitch: number
  cursorFollow: boolean
  drag: boolean
  zoom: boolean
  /** prefers-reduced-motion: no cursor-follow, no inertia, quicker transitions. */
  reducedMotion: boolean
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
/** Frame-rate independent exponential approach factor. */
const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

/* Tuning — deliberately slow and restrained. */
const FOLLOW_YAW = 9 // max look-around from the cursor, left/right (°) — subtle, not a joystick
const FOLLOW_PITCH = 4 // … up/down (°)
const FOLLOW_RATE = 1.2 // how quickly the follow target is chased (1/s) — cinematic
const SETTLE_RATE = 7 // camera easing towards its target (1/s)
const DRAG_RATE = 22 // while dragging: near-direct, still filtered
const RESET_RATE = 3.8 // reset glide (~1 s)
const ZOOM_RATE = 9
const FRICTION = 8 // after a drag: a brief settle (≤ ~7°), never a spin
const MAX_FLING = 60 // °/s cap on release velocity
const POLE_MARGIN = 10 // the edge of the view never gets closer than this to straight up/down

/* Field of view */
const DEFAULT_VFOV = 62
const DEFAULT_MAX_HFOV = 92
const PORTRAIT_VFOV = 70
const MAX_VFOV = 75 // zoom-out limit…
const MAX_HFOV = 100 // …and never wider than this horizontally
const MIN_VFOV = 20 // absolute zoom-in limit
const MIN_ZOOM_RANGE = 1.3 // zoom-in always available, even for a small panorama
const MAX_MAGNIFICATION = 2 // screen px per panorama texel before zoom-in stops

export class PanoramaController {
  /* Settable options */
  private opts: PanoramaOptions

  /* Where the camera is heading (drag / keys / reset move this) */
  private baseYaw: number
  private basePitch: number
  /* Cursor-follow offset: target from the pointer, and the eased value actually applied */
  private followX = 0
  private followY = 0
  private followTX = 0
  private followTY = 0
  private anchorX = 0
  private anchorY = 0
  private pointerInside = false
  private lastPX = 0
  private lastPY = 0
  /* Applied camera values */
  yaw: number
  pitch: number
  fov = 70
  private zoomLevel = 1
  private zoomTarget = 1
  /* Drag + inertia */
  private pointers = new Map<number, { x: number; y: number; type: string }>()
  private dragging = false
  private velYaw = 0
  private velPitch = 0
  private lastMoveT = 0
  private pinchStart: { dist: number; zoom: number } | null = null
  private resetting = false
  /* Viewport */
  private width = 1
  private height = 1
  private aspect = 16 / 9
  private paused = false
  /** Panorama texels per degree (width / 360); 0 until the texture is known. */
  private texelsPerDeg = 0

  /** Set by the canvas: request a frame. */
  wake: () => void = () => {}
  /** Set by the wrapper: called once the visitor first interacts (to fade the hint). */
  onInteract: () => void = () => {}

  constructor(opts: PanoramaOptions) {
    this.opts = opts
    this.baseYaw = this.yaw = opts.initialYaw
    this.basePitch = this.pitch = opts.initialPitch
  }

  setOptions(o: Partial<PanoramaOptions>) {
    this.opts = { ...this.opts, ...o }
    if (!this.opts.cursorFollow || this.opts.reducedMotion) this.followTX = this.followTY = 0
    this.wake()
  }

  /** Viewer size in CSS pixels (drag speed + default framing depend on it). */
  setViewport(width: number, height: number) {
    if (width <= 0 || height <= 0) return
    this.width = width
    this.height = height
    this.aspect = width / height
    this.wake()
  }

  /** Width in pixels of the panorama actually uploaded — sets how far zoom-in may go. */
  setTextureWidth(px: number) {
    this.texelsPerDeg = px > 0 ? px / 360 : 0
    this.wake()
  }

  /** Stop animating (e.g. scrolled out of view). Input still updates state; rendering resumes on unpause. */
  setPaused(p: boolean) {
    this.paused = p
    if (!p) this.wake()
  }

  /* ── Framing ─────────────────────────────────────────────────────────── */

  /** Vertical FOV that gives a horizontal FOV of `h` degrees at the current aspect. */
  private vFromH(h: number) {
    return deg(2 * Math.atan(Math.tan(rad(h / 2)) / this.aspect))
  }
  /** Default vertical FOV: moderate on landscape screens, a little taller on portrait ones. */
  defaultFov() {
    if (this.aspect < 1) return PORTRAIT_VFOV
    return Math.min(DEFAULT_VFOV, this.vFromH(DEFAULT_MAX_HFOV))
  }
  private maxFov() {
    return Math.max(this.defaultFov(), Math.min(MAX_VFOV, this.vFromH(MAX_HFOV)))
  }
  /** Narrowest FOV: where the panorama's own resolution runs out (see header). */
  minFov() {
    const def = this.defaultFov()
    const byResolution = this.texelsPerDeg > 0 ? this.height / (MAX_MAGNIFICATION * this.texelsPerDeg) : def / MIN_ZOOM_RANGE
    return Math.max(MIN_VFOV, Math.min(byResolution, def / MIN_ZOOM_RANGE))
  }
  private minZoom() {
    return this.defaultFov() / this.maxFov()
  }
  private maxZoom() {
    return this.defaultFov() / this.minFov()
  }
  private fovFor(zoom: number) {
    return this.defaultFov() / zoom
  }
  private pitchLimit(fov: number) {
    return Math.max(0, 90 - POLE_MARGIN - fov / 2)
  }

  /* ── Commands ────────────────────────────────────────────────────────── */

  reset() {
    // Take the short way round, so reset never spins a full turn.
    const turns = Math.round((this.yaw - this.opts.initialYaw) / 360)
    this.baseYaw = this.opts.initialYaw + turns * 360
    this.basePitch = this.opts.initialPitch
    // Drop the cursor-follow offset (the applied camera still glides — only targets change)
    // and make the pointer's current position the new neutral point.
    this.followX = this.followY = this.followTX = this.followTY = 0
    this.anchorX = this.lastPX
    this.anchorY = this.lastPY
    this.velYaw = this.velPitch = 0
    this.zoomTarget = 1
    this.resetting = true
    this.wake()
  }

  zoomBy(factor: number) {
    if (!this.opts.zoom) return
    this.zoomTarget = clamp(this.zoomTarget * factor, this.minZoom(), this.maxZoom())
    this.wake()
  }

  /** Keyboard: turn by a number of degrees. */
  turn(dYaw: number, dPitch: number) {
    this.resetting = false
    this.baseYaw += dYaw
    this.basePitch += dPitch
    this.wake()
  }

  /* ── Pointer input (called by the wrapper with coordinates relative to the viewer) ── */

  pointerEnter(x: number, y: number) {
    this.pointerInside = true
    this.setPointerNorm(x, y)
    // The centre of the viewer is neutral: cursor left of centre looks left, right looks right.
    // (Changes are eased, so entering at an edge starts a slow turn — never a jump.)
    this.anchorX = this.anchorY = 0
  }

  pointerLeave() {
    // The view holds where it is. Any re-anchoring from a drag/reset ends with this hover.
    this.pointerInside = false
  }

  pointerMove(id: number, x: number, y: number, type: string) {
    this.setPointerNorm(x, y)
    const p = this.pointers.get(id)
    if (!p) {
      // Hover (mouse only): cursor-follow.
      if (type === 'mouse' && !this.pointerInside) this.pointerEnter(x, y) // e.g. coming back off the controls
      if (type === 'mouse' && this.followEnabled() && this.pointers.size === 0) {
        this.followTX = clamp((this.lastPX - this.anchorX) * FOLLOW_YAW, -FOLLOW_YAW, FOLLOW_YAW)
        this.followTY = clamp(-(this.lastPY - this.anchorY) * FOLLOW_PITCH, -FOLLOW_PITCH, FOLLOW_PITCH)
        this.wake()
      }
      return
    }
    const dx = x - p.x
    const dy = y - p.y
    p.x = x
    p.y = y

    if (this.pointers.size >= 2 && this.opts.zoom) {
      const d = this.pinchDistance()
      if (this.pinchStart && d > 0) {
        this.zoomTarget = clamp(this.pinchStart.zoom * (d / this.pinchStart.dist), this.minZoom(), this.maxZoom())
        this.wake()
      }
      return
    }
    if (!this.dragging || !this.opts.drag) return

    // "Grab" the scene: content moves 1:1 under the finger / cursor.
    const degPerPx = this.fov / this.height
    const dYaw = -dx * degPerPx
    const dPitch = dy * degPerPx
    this.baseYaw += dYaw
    this.basePitch += dPitch
    const now = performance.now()
    const dt = Math.max(1, now - this.lastMoveT) / 1000
    this.lastMoveT = now
    // Smoothed release velocity
    this.velYaw = this.velYaw * 0.6 + (dYaw / dt) * 0.4
    this.velPitch = this.velPitch * 0.6 + (dPitch / dt) * 0.4
    this.wake()
  }

  pointerDown(id: number, x: number, y: number, type: string) {
    this.onInteract()
    this.resetting = false
    this.pointers.set(id, { x, y, type })
    this.setPointerNorm(x, y)
    if (this.pointers.size === 1) {
      // Fold the eased cursor-follow offset into the base so grabbing never jumps.
      this.baseYaw += this.followX
      this.basePitch += this.followY
      this.followX = this.followY = this.followTX = this.followTY = 0
      this.dragging = true
      this.velYaw = this.velPitch = 0
      this.lastMoveT = performance.now()
    } else if (this.pointers.size === 2) {
      this.dragging = false
      this.velYaw = this.velPitch = 0
      this.pinchStart = { dist: this.pinchDistance(), zoom: this.zoomTarget }
    }
    this.wake()
  }

  pointerUp(id: number) {
    if (!this.pointers.delete(id)) return
    if (this.pointers.size === 1) {
      // Pinch ended with one finger still down: continue as a drag from here, without a jump.
      this.pinchStart = null
      this.dragging = true
      this.velYaw = this.velPitch = 0
      this.lastMoveT = performance.now()
      return
    }
    if (this.pointers.size === 0) {
      this.dragging = false
      this.pinchStart = null
      // Only fling if the pointer was still moving when released.
      const still = performance.now() - this.lastMoveT > 90
      if (still || this.opts.reducedMotion) this.velYaw = this.velPitch = 0
      const speed = Math.hypot(this.velYaw, this.velPitch)
      if (speed > MAX_FLING) {
        this.velYaw *= MAX_FLING / speed
        this.velPitch *= MAX_FLING / speed
      }
      // The cursor's current position becomes the neutral point for cursor-follow.
      this.anchorX = this.lastPX
      this.anchorY = this.lastPY
      this.wake()
    }
  }

  /** Wheel / trackpad pinch. `deltaY` in pixels. */
  wheel(deltaY: number) {
    this.onInteract()
    this.zoomBy(Math.exp(-deltaY * 0.0015))
  }

  get isDragging() {
    return this.dragging
  }

  /* ── Frame update ────────────────────────────────────────────────────── */

  /** Advance the camera. Returns true while anything is still moving (keep rendering). */
  update(dtRaw: number): boolean {
    if (this.paused) return false
    const dt = Math.min(dtRaw, 1 / 20) // a long frame must not teleport the camera
    const reduced = this.opts.reducedMotion

    // Inertia after release
    if (!this.dragging && (this.velYaw || this.velPitch)) {
      this.baseYaw += this.velYaw * dt
      this.basePitch += this.velPitch * dt
      const k = Math.exp(-FRICTION * dt)
      this.velYaw *= k
      this.velPitch *= k
      if (Math.hypot(this.velYaw, this.velPitch) < 0.5) this.velYaw = this.velPitch = 0
    }

    // Zoom → FOV, then keep pitch within the pole limits for that FOV
    this.zoomTarget = clamp(this.zoomTarget, this.minZoom(), this.maxZoom())
    this.zoomLevel += (this.zoomTarget - this.zoomLevel) * approach(reduced ? 20 : ZOOM_RATE, dt)
    this.fov = this.fovFor(this.zoomLevel)
    const limit = this.pitchLimit(this.fov)
    this.basePitch = clamp(this.basePitch, -limit, limit)

    // Cursor-follow easing
    const f = approach(FOLLOW_RATE, dt)
    this.followX += (this.followTX - this.followX) * f
    this.followY += (this.followTY - this.followY) * f

    // Camera easing towards base + follow
    const rate = this.dragging ? DRAG_RATE : this.resetting ? (reduced ? 14 : RESET_RATE) : SETTLE_RATE
    const a = approach(rate, dt)
    const targetYaw = this.baseYaw + this.followX
    const targetPitch = clamp(this.basePitch + this.followY, -limit, limit)
    this.yaw += (targetYaw - this.yaw) * a
    this.pitch += (targetPitch - this.pitch) * a

    const moving =
      this.dragging ||
      this.pointers.size > 0 ||
      Math.abs(targetYaw - this.yaw) > 0.01 ||
      Math.abs(targetPitch - this.pitch) > 0.01 ||
      Math.abs(this.followTX - this.followX) > 0.01 ||
      Math.abs(this.followTY - this.followY) > 0.01 ||
      Math.abs(this.zoomTarget - this.zoomLevel) > 0.0005 ||
      this.velYaw !== 0 ||
      this.velPitch !== 0
    if (!moving) {
      this.resetting = false
      // Keep yaw bounded over long sessions without any visible change.
      if (Math.abs(this.yaw) > 3600) {
        const wrap = Math.round(this.yaw / 360) * 360
        this.yaw -= wrap
        this.baseYaw -= wrap
      }
    }
    return moving
  }

  /* ── internals ───────────────────────────────────────────────────────── */

  private followEnabled() {
    return this.opts.cursorFollow && !this.opts.reducedMotion
  }
  private setPointerNorm(x: number, y: number) {
    this.lastPX = clamp((x / this.width) * 2 - 1, -1, 1)
    this.lastPY = clamp((y / this.height) * 2 - 1, -1, 1)
  }
  private pinchDistance() {
    const [a, b] = [...this.pointers.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
}
