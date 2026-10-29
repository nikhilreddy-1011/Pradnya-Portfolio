'use client'

/**
 * WebGL scene (React Three Fiber). Loaded only via dynamic import from ModelStage, so
 * three.js never touches the initial bundle.
 *
 * Signature build sequence — works with any GLB, richer with the naming convention:
 *   plan (floor-level section) → walls rise (clipping plane) → floor → furniture
 *   → materials (clay → real) → lighting
 * Node names:  wall*  floor*  furn*  light*  ceil* (hidden by default, cutaway)
 */
import { Environment, Html, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Component, type ComponentRef, type ReactNode, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { KTX2Loader } from 'three-stdlib' // same loader family drei's useGLTF uses

import type { Model3D, Vec3 } from '@/lib/types'

export type ViewRequest = { key: string; n: number }
export type SceneInfo = { hasFurniture: boolean; hasCeiling: boolean; stages: string[] }

type Props = {
  src: string
  model: Model3D
  furniture: boolean
  ceiling: boolean
  showHotspots: boolean
  activeHotspot: number | null
  onHotspot: (i: number | null) => void
  view: ViewRequest | null
  replay: number
  animate: boolean
  zoomEnabled: boolean
  shadows: boolean
  onReady: () => void
  onError: () => void
  onStage: (label: string) => void
  onInfo: (info: SceneInfo) => void
}

type Group = 'wall' | 'floor' | 'furn' | 'light' | 'ceil' | 'other'
const PATTERNS: [Group, RegExp][] = [
  ['wall', /^wall/i],
  ['floor', /^floor/i],
  ['furn', /^(furn|furniture)/i],
  ['light', /^(light|lamp)/i],
  ['ceil', /^ceil/i],
]
const classify = (obj: THREE.Object3D): Group => {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    for (const [g, re] of PATTERNS) if (re.test(o.name)) return g
  }
  return 'other'
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const v3 = (a?: Vec3) => (a ? new THREE.Vector3(...a) : undefined)

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/* ────────────────────────────────────────────────────────────────────────── */

function Scene(props: Props) {
  const { src, model } = props
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const keyLight = useRef<THREE.DirectionalLight>(null)

  const ktx2 = useMemo(() => new KTX2Loader().setTranscoderPath('/decoders/basis/').detectSupport(gl), [gl])
  const gltf = useGLTF(src, '/decoders/draco/', true, (loader) => {
    loader.setKTX2Loader(ktx2)
  })
  const root = gltf.scene

  /* Analyse the model once: groups, bounds, default camera. */
  const info = useMemo(() => {
    const groups: Record<Group, THREE.Mesh[]> = { wall: [], floor: [], furn: [], light: [], ceil: [], other: [] }
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      groups[classify(m)].push(m)
    })
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const target = v3(model.cameraTarget) ?? new THREE.Vector3(center.x, box.min.y + size.y * 0.25, center.z)
    const home =
      v3(model.cameraPosition) ??
      target.clone().add(new THREE.Vector3(0.55, 1.25, 0.95).normalize().multiplyScalar(maxDim * 1.5))
    // Plan view: high and only slightly tilted, so the floor-level section reads as a drawing.
    const plan = new THREE.Vector3(center.x, box.min.y + maxDim * 1.45, center.z + maxDim * 0.28)
    return { groups, box, size, center, maxDim, target, home, plan }
  }, [root, model.cameraPosition, model.cameraTarget])

  const views = useMemo(() => {
    const map = new Map<string, { position: THREE.Vector3; target: THREE.Vector3 }>()
    map.set('__home', { position: info.home, target: info.target })
    for (const v of model.views) {
      const p = v3(v.position)
      if (p) map.set(v.key, { position: p, target: v3(v.target) ?? info.target })
    }
    return map
  }, [model.views, info])

  /* ── Camera fly-to ─────────────────────────────────────────────────── */
  const fly = useRef<{ from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t: number; dur: number } | null>(null)
  const flyTo = (position: THREE.Vector3, target: THREE.Vector3, dur = 1.4) => {
    const c = controls.current
    if (!c) return
    if (!props.animate) {
      camera.position.copy(position)
      c.target.copy(target)
      c.update()
      invalidate()
      return
    }
    fly.current = { from: camera.position.clone(), to: position.clone(), tFrom: c.target.clone(), tTo: target.clone(), t: 0, dur }
    invalidate()
  }

  useEffect(() => {
    if (!props.view) return
    const v = views.get(props.view.key) ?? views.get('__home')!
    flyTo(v.position, v.target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.view?.n])

  /* ── Build sequence ────────────────────────────────────────────────── */
  const build = useRef<{
    t: number
    running: boolean
    stages: { name: Group | 'plan' | 'materials' | 'lighting'; label: string; start: number; end: number }[]
    twins: THREE.Object3D[]
    clay: Record<string, THREE.MeshStandardMaterial>
    lines: THREE.LineBasicMaterial
    originals: Set<THREE.Material>
    emissive: { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[]
    plane: THREE.Plane
    lastLabel: string
  } | null>(null)

  // Tuned against headless renders of the demo model: calm, architectural, never blown out.
  const setLighting = (k: number) => {
    scene.environmentIntensity = 0.25 + 0.3 * k
    if (keyLight.current) keyLight.current.intensity = 0.4 + 1.1 * k
  }

  const teardown = () => {
    const b = build.current
    if (!b) return
    b.twins.forEach((t) => {
      t.parent?.remove(t)
      if ((t as THREE.LineSegments).isLineSegments) (t as THREE.LineSegments).geometry.dispose()
    })
    Object.values(b.clay).forEach((m) => m.dispose())
    b.lines.dispose()
    b.originals.forEach((m) => (m.visible = true))
    b.emissive.forEach(({ mat, color, intensity }) => {
      mat.emissive.copy(color)
      mat.emissiveIntensity = intensity
    })
    gl.clippingPlanes = []
    build.current = null
  }

  const finish = () => {
    teardown()
    setLighting(1)
    info.groups.light.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat?.emissive && mat.emissive.getHex() === 0) {
        mat.emissive.set('#ffdcae')
        mat.emissiveIntensity = 1.2
      }
    })
    props.onStage('')
    invalidate()
  }

  const start = () => {
    teardown()
    const { groups } = info
    const mk = () =>
      new THREE.MeshStandardMaterial({
        color: '#ebe5d9',
        roughness: 0.95,
        metalness: 0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    const clay = { base: mk(), floor: mk(), furn: mk() }
    const originals = new Set<THREE.Material>()
    const twins: THREE.Object3D[] = []
    // Wall outlines: at floor level they ARE the plan drawing; they extrude as the walls rise.
    const lines = new THREE.LineBasicMaterial({ color: '#1d1d1b', transparent: true, opacity: 1 })
    const wallTris = groups.wall.reduce((n, m) => n + (m.geometry.index?.count ?? m.geometry.attributes.position.count) / 3, 0)
    if (wallTris < 400_000) {
      for (const m of groups.wall) {
        const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), lines)
        l.name = '__outline'
        m.add(l)
        twins.push(l)
      }
    }
    const all = [...groups.wall, ...groups.floor, ...groups.furn, ...groups.light, ...groups.other]
    for (const m of all) {
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      mats.forEach((x) => {
        originals.add(x)
        x.visible = false
      })
      const g = classify(m)
      const twin = new THREE.Mesh(m.geometry, g === 'floor' ? clay.floor : g === 'furn' || g === 'light' ? clay.furn : clay.base)
      twin.name = '__clay'
      twin.castShadow = true
      twin.receiveShadow = true
      twin.userData.group = g
      m.add(twin)
      twins.push(twin)
    }
    // Light fixtures start dark
    const emissive: { mat: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[] = []
    groups.light.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat?.emissive) {
        emissive.push({ mat, color: mat.emissive.clone(), intensity: mat.emissiveIntensity })
        if (mat.emissive.getHex() === 0) mat.emissive.set('#ffdcae')
        mat.emissiveIntensity = 0
      }
    })

    // Timeline — stages without matching geometry are skipped.
    const spec: { name: Group | 'plan' | 'materials' | 'lighting'; label: string; dur: number; on: boolean }[] = [
      { name: 'plan', label: 'Plan', dur: 1.1, on: true },
      { name: 'wall', label: 'Walls rise', dur: 1.8, on: true },
      { name: 'floor', label: 'Floor', dur: 0.7, on: groups.floor.length > 0 },
      { name: 'furn', label: 'Furniture', dur: 1.0, on: groups.furn.length > 0 },
      { name: 'materials', label: 'Materials', dur: 1.2, on: true },
      { name: 'lighting', label: 'Light', dur: 1.2, on: true },
    ]
    let t0 = 0
    const stages = spec
      .filter((s) => s.on)
      .map((s) => {
        const st = { name: s.name, label: s.label, start: t0, end: t0 + s.dur }
        t0 += s.dur
        return st
      })

    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), info.box.min.y + 0.06)
    gl.clippingPlanes = [plane]
    build.current = { t: 0, running: true, stages, twins, clay, lines, originals, emissive, plane, lastLabel: '' }
    setLighting(0)
    props.onInfo({ hasFurniture: groups.furn.length > 0, hasCeiling: groups.ceil.length > 0, stages: stages.map((s) => s.label) })

    // Start from above — the plan — then descend into the 3/4 view as walls rise.
    const c = controls.current
    camera.position.copy(info.plan)
    if (c) {
      c.target.copy(info.target)
      c.update()
    }
    invalidate()
  }

  // Initialise once the model is in the scene; replay on request.
  useLayoutEffect(() => {
    camera.position.copy(info.home)
    ;(camera as THREE.PerspectiveCamera).near = Math.max(0.01, info.maxDim / 500)
    ;(camera as THREE.PerspectiveCamera).far = info.maxDim * 20
    camera.updateProjectionMatrix()
    props.onInfo({ hasFurniture: info.groups.furn.length > 0, hasCeiling: info.groups.ceil.length > 0, stages: [] })
    if (props.animate && model.buildSequence) start()
    else finish()
    props.onReady()
    return () => teardown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info])

  useEffect(() => {
    if (props.replay > 0) {
      if (props.animate) start()
      else finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.replay])

  // Layer visibility
  useEffect(() => {
    info.groups.furn.forEach((m) => (m.visible = props.furniture))
    info.groups.ceil.forEach((m) => (m.visible = props.ceiling))
    invalidate()
  }, [props.furniture, props.ceiling, info, invalidate])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)

    // Camera flight
    const f = fly.current
    if (f && controls.current) {
      f.t = Math.min(1, f.t + dt / f.dur)
      const k = ease(f.t)
      camera.position.lerpVectors(f.from, f.to, k)
      controls.current.target.lerpVectors(f.tFrom, f.tTo, k)
      controls.current.update()
      if (f.t >= 1) fly.current = null
      invalidate()
    }

    // Build sequence
    const b = build.current
    if (!b?.running) return
    b.t += dt
    const at = (name: string) => b.stages.find((s) => s.name === name)
    const p = (name: string) => {
      const s = at(name)
      return s ? clamp01((b.t - s.start) / (s.end - s.start)) : 1
    }
    const current = b.stages.find((s) => b.t >= s.start && b.t < s.end)
    const label = current?.label ?? ''
    if (label !== b.lastLabel) {
      b.lastLabel = label
      props.onStage(label)
    }

    const { box, size } = info
    // Walls rise: the section plane climbs from floor level to the top of the model.
    const wallK = ease(p('wall'))
    b.plane.constant = box.min.y + 0.06 + (size.y + 0.05) * wallK

    // Camera descends from plan view during the plan + walls stages.
    const camK = ease(clamp01((b.t - 0.5) / ((at('wall')?.end ?? 2.9) - 0.5)))
    if (!fly.current && controls.current) {
      camera.position.lerpVectors(info.plan, info.home, camK)
      controls.current.update()
    }

    const floorK = p('floor')
    const furnK = p('furn')
    b.twins.forEach((tw) => {
      if (tw.name === '__outline') return
      const g = tw.userData.group as Group
      if (g === 'floor') tw.visible = floorK > 0 || !at('floor')
      if (g === 'furn' || g === 'light') tw.visible = furnK > 0 || !at('furn')
    })
    b.clay.floor.opacity = at('floor') ? ease(floorK) : 1
    b.clay.furn.opacity = at('furn') ? ease(furnK) : 1

    // Materials: real materials appear, clay fades away above them.
    const matK = p('materials')
    if (matK > 0) {
      b.originals.forEach((m) => (m.visible = true))
      const o = 1 - ease(matK)
      Object.values(b.clay).forEach((c) => {
        c.opacity = Math.min(c.opacity, o)
        c.depthWrite = o > 0.98
      })
      b.lines.opacity = o
    }

    // Lighting
    const lightK = ease(p('lighting'))
    setLighting(lightK)
    b.emissive.forEach(({ mat, intensity }) => (mat.emissiveIntensity = (intensity || 1.2) * lightK))

    const end = b.stages[b.stages.length - 1].end
    if (b.t >= end) {
      b.running = false
      finish()
    }
    invalidate()
  })

  // Free GPU memory when this model is replaced/unmounted.
  useEffect(
    () => () => {
      useGLTF.clear(src)
      ktx2.dispose()
    },
    [src, ktx2],
  )

  const r = info.maxDim
  return (
    <>
      <color attach="background" args={['#ebe6dd']} />
      <hemisphereLight args={['#fff6ea', '#3a342c', 0.3]} />
      <directionalLight
        ref={keyLight}
        position={[info.center.x + r * 0.6, info.box.max.y + r, info.center.z + r * 0.4]}
        intensity={1.6}
        castShadow={props.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-far={r * 4}
      />
      {/* Procedural studio lighting — no HDR download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#fff4e2" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe7cc" position={[-8, 3, -4]} rotation-y={Math.PI / 2.5} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#e8eef6" position={[8, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[10, 4, 1]} />
      </Environment>

      <primitive object={root} />

      {props.showHotspots &&
        model.hotspots.map((h, i) =>
          h.position ? (
            <Html key={i} position={h.position} center zIndexRange={[20, 0]}>
              <button
                type="button"
                className="hotspot"
                aria-pressed={props.activeHotspot === i}
                aria-label={`${String(i + 1).padStart(2, '0')} ${h.label}: ${h.title}`}
                onClick={() => props.onHotspot(props.activeHotspot === i ? null : i)}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            </Html>
          ) : null,
        )}

      <OrbitControls
        ref={controls}
        makeDefault
        target={info.target}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.7}
        screenSpacePanning
        enableZoom={props.zoomEnabled}
        minDistance={r * 0.08}
        maxDistance={r * 3}
        maxPolarAngle={Math.PI * 0.495}
      />
    </>
  )
}

export default function ModelCanvas(props: Props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      shadows={props.shadows}
      camera={{ fov: 38, near: 0.05, far: 500, position: [8, 6, 8] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.85
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          props.onError()
        })
      }}
      aria-label={`${props.model.title} — interactive 3D model. Drag to orbit, pinch or scroll to zoom.`}
      role="img"
    >
      <Boundary onError={props.onError}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Boundary>
    </Canvas>
  )
}
