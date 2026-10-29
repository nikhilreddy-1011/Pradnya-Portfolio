'use client'

/**
 * WebGL half of the 360° viewer (React Three Fiber). Loaded only via dynamic import from
 * Panorama360Viewer, so three.js never touches the initial bundle — and it shares the
 * three/R3F chunk with the 3D model viewer.
 *
 * An equirectangular (2:1) image is mapped onto the inside of a UV sphere:
 *  - geometry.scale(-1, 1, 1) turns the sphere inside out, so the image reads left→right
 *    from the centre (not mirrored);
 *  - the texture is uploaded un-flipped (ImageBitmap uploads ignore UNPACK_FLIP_Y in some
 *    browsers), so V is flipped in the geometry instead — identical result everywhere;
 *  - RepeatWrapping on U lets bilinear/mip filtering wrap across the 0°/360° seam;
 *  - toneMapped: false + sRGB texture → the render's colours are shown exactly as supplied.
 *
 * Rendering is on demand: a frame is drawn only while the camera is moving.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { PanoramaController } from './panorama/controller'

type Source = ImageBitmap | HTMLImageElement

type Props = {
  source: Source
  controller: PanoramaController
  maxDpr: number
  onReady: () => void
  onError: () => void
}

const RADIUS = 500

function Sphere({ source, controller, onReady }: Omit<Props, 'maxDpr' | 'onError'>) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  const readySent = useRef(false)

  const texture = useMemo(() => {
    const t = new THREE.Texture(source)
    t.colorSpace = THREE.SRGBColorSpace
    t.flipY = false
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.magFilter = THREE.LinearFilter
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.generateMipmaps = true
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    t.needsUpdate = true
    return t
  }, [source, gl])

  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(RADIUS, 128, 64)
    g.scale(-1, 1, 1)
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i))
    uv.needsUpdate = true
    return g
  }, [])

  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, depthWrite: false }), [texture])

  // Free GPU memory when the viewer unmounts or the image changes.
  useEffect(() => () => texture.dispose(), [texture])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => geometry.dispose(), [geometry])

  // The controller wakes the render loop on input.
  useEffect(() => {
    controller.wake = () => invalidate()
    invalidate()
    return () => {
      controller.wake = () => {}
    }
  }, [controller, invalidate])

  useEffect(() => controller.setViewport(size.width, size.height), [controller, size.width, size.height])

  useFrame((_, dt) => {
    const moving = controller.update(dt)
    if (camera.fov !== controller.fov) {
      camera.fov = controller.fov
      camera.updateProjectionMatrix()
    }
    const lon = THREE.MathUtils.degToRad(controller.yaw)
    const lat = THREE.MathUtils.degToRad(controller.pitch)
    camera.lookAt(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))
    if (moving) invalidate()
    if (!readySent.current) {
      readySent.current = true
      // Fires after this first textured frame has been drawn.
      requestAnimationFrame(() => onReady())
    }
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

export default function PanoramaCanvas({ source, controller, maxDpr, onReady, onError }: Props) {
  // R3F deliberately loses the context when it unmounts; only a loss while mounted is an error.
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  return (
    <Canvas
      frameloop="demand"
      flat
      dpr={[1, maxDpr]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ fov: controller.fov, near: 1, far: RADIUS * 2.2, position: [0, 0, 0] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          if (alive.current) onError()
        })
      }}
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    >
      <Sphere source={source} controller={controller} onReady={onReady} />
    </Canvas>
  )
}
