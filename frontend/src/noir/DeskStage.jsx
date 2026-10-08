import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { portrait } from "../components/portraits"
import { CARD_H, CARD_W, drawMarker, drawMugshot } from "./mugshot"
import { prefersStill } from "./support"

const MODEL = `${import.meta.env.BASE_URL}assets/noir/props.glb`
const FLOOR = "#15100b"
const DESK_DROP = -0.304
const CARD = { w: 0.25, h: 0.35 }
const SWEEP_ORDER = [2, 0, 3, 1, 4]
const FOCUS = { angle: 0.2, intensity: 18 }
const WIDE = { angle: 0.8, intensity: 9 }

const moods = {
  idle: { spot: new THREE.Color("#ffcf94"), fill: new THREE.Color("#4b5b7c"), lift: 1.35 },
  guilty: { spot: new THREE.Color("#ffd98f"), fill: new THREE.Color("#6a5a45"), lift: 1.4 },
  cleared: { spot: new THREE.Color("#b6c6e6"), fill: new THREE.Color("#34425e"), lift: 1.05 },
}

useLoader.preload(GLTFLoader, MODEL)

function layout(count, narrow) {
  const spots = []
  if (!narrow) {
    for (let i = 0; i < count; i++) spots.push([(i - (count - 1) / 2) * 0.315, 0.08])
    return spots
  }
  const top = Math.ceil(count / 2)
  for (let i = 0; i < count; i++) {
    const row = i < top ? 0 : 1
    const inRow = row === 0 ? top : count - top
    const col = row === 0 ? i : i - top
    spots.push([(col - (inRow - 1) / 2) * 0.335, row === 0 ? -0.0 : 0.375])
  }
  return spots
}

function jitter(index) {
  const seed = Math.sin(index * 91.7 + 3.1) * 10000
  const f = seed - Math.floor(seed)
  return (f - 0.5) * 0.07
}

function Prop({ name, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const gltf = useLoader(GLTFLoader, MODEL)
  const object = useMemo(() => {
    const clone = gltf.scene.getObjectByName(name).clone(true)
    clone.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        node.receiveShadow = true
      }
    })
    return clone
  }, [gltf, name])
  return <primitive object={object} position={position} rotation={rotation} scale={scale} />
}

function useMugshot(name, no, voters) {
  const parts = useState(() => {
    const canvas = document.createElement("canvas")
    canvas.width = CARD_W
    canvas.height = CARD_H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return { canvas, texture, image: { current: null } }
  })[0]
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    let live = true
    const paint = () => {
      drawMugshot(parts.canvas, { name, no, voters, image: parts.image.current })
      parts.texture.needsUpdate = true
      invalidate()
    }
    paint()
    if (!parts.image.current) {
      const image = new Image()
      image.onload = () => {
        if (!live) return
        parts.image.current = image
        paint()
      }
      image.src = portrait(name).uri
    }
    document.fonts?.load(`700 44px "Fraunces Variable"`).then(() => live && paint()).catch(() => {})
    return () => {
      live = false
    }
  }, [name, no, voters, parts, invalidate])

  useEffect(() => () => parts.texture.dispose(), [parts])
  return parts.texture
}

function Marker({ still }) {
  const parts = useState(() => {
    const canvas = document.createElement("canvas")
    canvas.width = CARD_W
    canvas.height = CARD_H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return { canvas, texture, start: null }
  })[0]

  useFrame((state) => {
    if (parts.start === null) parts.start = state.clock.elapsedTime
    const p = still ? 1 : Math.min(1, (state.clock.elapsedTime - parts.start) / 0.7)
    if (parts.done) return
    drawMarker(parts.canvas, p)
    parts.texture.needsUpdate = true
    if (p < 1) state.invalidate()
    else parts.done = true
  })

  useEffect(() => () => parts.texture.dispose(), [parts])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} renderOrder={2}>
      <planeGeometry args={[CARD.w * 1.16, CARD.h * 1.16]} />
      <meshBasicMaterial map={parts.texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

const paperSide = new THREE.MeshStandardMaterial({ color: "#d8cbb0", roughness: 0.95 })

function Card({ name, no, spot, tilt, picked, circled, voters, still, onPick }) {
  const texture = useMugshot(name, no, voters)
  const faces = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 })
    return [paperSide, paperSide, top, paperSide, paperSide, paperSide]
  }, [texture])

  useEffect(() => () => faces[2].dispose(), [faces])

  return (
    <group position={[spot[0], picked ? 0.012 : 0.004, spot[1]]} rotation={[0, tilt, 0]}>
      <mesh
        castShadow
        receiveShadow
        material={faces}
        onClick={onPick ? () => onPick(name) : undefined}
        onPointerOver={onPick ? () => (document.body.style.cursor = "pointer") : undefined}
        onPointerOut={onPick ? () => (document.body.style.cursor = "") : undefined}
      >
        <boxGeometry args={[CARD.w, 0.004, CARD.h]} />
      </mesh>
      {circled && <Marker still={still} />}
    </group>
  )
}

function Rig({ narrow, sway, still }) {
  const { camera, size } = useThree()
  const fit = useMemo(() => {
    const aspect = size.width / size.height
    const tan = Math.tan((camera.fov * Math.PI) / 360)
    const needW = narrow ? 1.12 : 2.25
    const needH = narrow ? 0.95 : 0.8
    return Math.max(needW / (2 * tan * aspect), needH / (2 * tan))
  }, [size.width, size.height, camera.fov, narrow])

  const elevation = 0.88
  const aim = useMemo(() => new THREE.Vector3(0, narrow ? 0.1 : 0.1, narrow ? 0.26 : -0.04), [narrow])

  useLayoutEffect(() => {
    camera.position.set(aim.x, aim.y + Math.sin(elevation) * fit, aim.z + Math.cos(elevation) * fit)
    camera.lookAt(aim)
    camera.updateProjectionMatrix()
  }, [camera, fit, aim])

  useFrame((state) => {
    if (!sway || still) return
    const t = state.clock.elapsedTime
    camera.position.x = aim.x + Math.sin(t * 0.22) * 0.05
    camera.position.y = aim.y + Math.sin(elevation) * fit + Math.sin(t * 0.17) * 0.012
    camera.lookAt(aim)
    state.invalidate()
  })
  return null
}

function Lights({ spots, focusIndex, sweep, mood, still }) {
  const spot = useRef()
  const target = useRef()
  const glow = useRef()
  const hemi = useRef()
  const state = useRef({ x: 0, z: 0, angle: WIDE.angle, intensity: WIDE.intensity, ready: false })
  const palette = moods[mood] ?? moods.idle

  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])

  useFrame((frame, delta) => {
    const s = state.current
    let index = focusIndex
    if (sweep && spots.length) {
      const period = sweep === "fast" ? 0.85 : 2.4
      index = SWEEP_ORDER[Math.floor(frame.clock.elapsedTime / period) % SWEEP_ORDER.length] % spots.length
    }
    const hit = index !== null && index !== undefined && spots[index]
    const goal = hit ? spots[index] : [0, spots[0]?.[1] ?? 0]
    const goalAngle = hit ? FOCUS.angle : WIDE.angle
    const goalPower = hit ? FOCUS.intensity : WIDE.intensity
    const k = still || !s.ready ? 1 : 1 - Math.exp(-7 * Math.min(delta, 0.1))
    s.ready = true
    const dx = goal[0] - s.x
    const dz = goal[1] - s.z
    s.x += dx * k
    s.z += dz * k
    s.angle += (goalAngle - s.angle) * k
    s.intensity += (goalPower - s.intensity) * k

    const light = spot.current
    light.position.set(s.x * 0.85, 1.15, s.z + 0.5)
    light.angle = s.angle
    light.intensity = s.intensity
    light.color.lerp(palette.spot, k)
    target.current.position.set(s.x, 0, s.z)
    target.current.updateMatrixWorld()
    hemi.current.color.lerp(palette.fill, k)
    hemi.current.intensity += (palette.lift - hemi.current.intensity) * k
    glow.current.intensity += ((mood === "cleared" ? 0.6 : 2.2) - glow.current.intensity) * k

    const moving = Math.abs(dx) + Math.abs(dz) > 0.0006 || Math.abs(goalAngle - s.angle) > 0.002 || Boolean(sweep)
    if (moving || Math.abs(goalPower - s.intensity) > 0.05) frame.invalidate()
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={["#4b5b7c", "#2a1c10", 1.35]} />
      <object3D ref={target} />
      <spotLight
        ref={spot}
        castShadow
        penumbra={0.9}
        decay={2}
        distance={4}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight ref={glow} color="#ffb766" position={[-0.55, 0.52, -0.1]} intensity={2} distance={1.1} decay={2} />
    </>
  )
}

function Table({ narrow }) {
  const x = narrow ? 0.62 : 1
  return (
    <group>
      <Prop name="Desk_01" position={[0, DESK_DROP, 0]} />
      <Prop name="Pinboard_01" position={[0, 0.86, -0.47]} rotation={[-0.1, 0, 0]} />
      <Prop name="Desk_Lamp_01" position={[-0.68 * x, 0, narrow ? -0.3 : -0.26]} rotation={[0, 0.5, 0]} />
      <Prop name="Cigarette_Tray_01" position={[0.62 * x, 0.024, narrow ? -0.32 : -0.2]} />
      <Prop name="Cigarette_Lit_01" position={[0.6 * x, 0.082, narrow ? -0.32 : -0.2]} rotation={[0, -0.6, 0]} />
      <Prop name="Alcohol_Bottle_01" position={[0.8 * x, 0, narrow ? -0.34 : -0.3]} />
      <Prop name="Alcohol_Glass_01" position={narrow ? [0.18, 0, -0.34] : [0.72, 0, -0.06]} />
      {!narrow && (
        <>
          <Prop name="Folder_02" position={[-0.18, 0.004, -0.2]} rotation={[0, 0.12, 0]} />
          <Prop name="Folder_01" position={[0.2, 0.014, -0.24]} rotation={[0, -0.18, 0]} />
          <Prop name="Paper_Pile_01" position={[-0.66, -0.012, 0.5]} rotation={[0, 0.4, 0]} />
          <Prop name="Paper_Crumpled_01" position={[-0.3, 0.05, 0.5]} />
          <Prop name="Cup_Coffee_01" position={[0.62, 0.08, 0.46]} />
          <Prop name="Pen_01" position={[0.3, 0.01, 0.5]} rotation={[0, 0.5, Math.PI / 2]} />
          <Prop name="Cigarette_Pack_01" position={[0.82, 0.021, 0.26]} rotation={[-Math.PI / 2, 0, 0.5]} />
        </>
      )}
    </group>
  )
}

export default function DeskStage({
  suspects,
  focus = null,
  circled = null,
  mood = "idle",
  sweep = null,
  voters = {},
  onPick,
  sway = false,
}) {
  const wrap = useRef(null)
  const [visible, setVisible] = useState(true)
  const [size, setSize] = useState({ w: 800, h: 360 })
  const still = useMemo(() => prefersStill(), [])
  const narrow = size.w / size.h < 1.45

  useEffect(() => {
    const node = wrap.current
    if (!node) return undefined
    const watch = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width && height) setSize({ w: width, h: height })
    })
    const view = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    watch.observe(node)
    view.observe(node)
    return () => {
      watch.disconnect()
      view.disconnect()
    }
  }, [])

  const spots = useMemo(() => layout(suspects.length, narrow), [suspects.length, narrow])
  const focusIndex = focus ? suspects.indexOf(focus) : -1

  return (
    <div className="desk-canvas" ref={wrap}>
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        frameloop={visible ? "demand" : "never"}
        camera={{ fov: 28, near: 0.1, far: 12 }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={[FLOOR]} />
        <Rig narrow={narrow} sway={sway} still={still} />
        <Lights
          spots={spots}
          focusIndex={focusIndex >= 0 ? focusIndex : null}
          sweep={sweep}
          mood={mood}
          still={still}
        />
        <Table narrow={narrow} />
        {suspects.map((name, index) => (
          <Card
            key={name}
            name={name}
            no={index + 1}
            spot={spots[index]}
            tilt={jitter(index)}
            picked={focus === name}
            circled={circled === name}
            voters={voters[name] ?? ""}
            still={still}
            onPick={onPick}
          />
        ))}
      </Canvas>
    </div>
  )
}
