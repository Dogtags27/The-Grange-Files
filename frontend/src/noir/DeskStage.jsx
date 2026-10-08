import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { portrait } from "../components/portraits"
import { CARD_H, CARD_W, drawMarker, drawMugshot } from "./mugshot"
import { prefersStill } from "./support"

const MODEL = `${import.meta.env.BASE_URL}assets/noir/props.glb`
const FLOOR = "#15100b"
const FOG = "#2a2622"
const DESK_DROP = -0.304
const CARD = { w: 0.25, h: 0.35 }
const SWEEP_ORDER = [2, 0, 3, 1, 4]
const FOCUS = { angle: 0.2, intensity: 18 }
const WIDE = { angle: 0.8, intensity: 9 }

const moods = {
  room: { spot: new THREE.Color("#ffc888"), fill: new THREE.Color("#3d4b6a"), lift: 0.95 },
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

function fitDistance(fov, aspect, needW, needH) {
  const tan = Math.tan((fov * Math.PI) / 360)
  return Math.max(needW / (2 * tan * aspect), needH / (2 * tan))
}

function goalFor(view, aspect, narrow) {
  if (view === "room") {
    return {
      pos: new THREE.Vector3(narrow ? -2.4 : -2.9, 0.62, narrow ? 5.6 : 4.1),
      aim: new THREE.Vector3(narrow ? 0.1 : 0.35, 0.28, -0.7),
      fov: narrow ? 56 : 50,
    }
  }
  const fov = 28
  const desk = view === "desk"
  const elevation = desk ? 1.02 : 0.88
  const aim = desk
    ? new THREE.Vector3(0, 0.05, narrow ? 0.2 : 0.06)
    : new THREE.Vector3(0, 0.1, narrow ? 0.26 : -0.04)
  const needW = desk ? (narrow ? 1.2 : 2.3) : narrow ? 1.12 : 2.25
  const needH = desk ? (narrow ? 1.3 : 1.0) : narrow ? 0.95 : 0.8
  const dist = fitDistance(fov, aspect, needW, needH)
  return {
    pos: new THREE.Vector3(aim.x, aim.y + Math.sin(elevation) * dist, aim.z + Math.cos(elevation) * dist),
    aim,
    fov,
  }
}

function Rig({ view, narrow, sway, still }) {
  const { camera, size } = useThree()
  const now = useRef({ ready: false, aim: new THREE.Vector3() })

  useFrame((frame, delta) => {
    const s = now.current
    const goal = goalFor(view, size.width / size.height, narrow)
    if (sway && !still && view === "banner") {
      const t = frame.clock.elapsedTime
      goal.pos.x += Math.sin(t * 0.22) * 0.05
      goal.pos.y += Math.sin(t * 0.17) * 0.012
    }
    const k = still || !s.ready ? 1 : 1 - Math.exp(-0.8 * Math.min(delta, 0.1))
    if (!s.ready) s.aim.copy(goal.aim)
    s.ready = true
    camera.position.lerp(goal.pos, k)
    s.aim.lerp(goal.aim, k)
    camera.fov += (goal.fov - camera.fov) * k
    camera.lookAt(s.aim)
    camera.updateProjectionMatrix()
    const moving =
      camera.position.distanceTo(goal.pos) > 0.002 ||
      s.aim.distanceTo(goal.aim) > 0.002 ||
      Math.abs(goal.fov - camera.fov) > 0.02
    if (moving || (sway && !still && view === "banner")) frame.invalidate()
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
    glow.current.intensity += ((mood === "cleared" ? 0.6 : mood === "room" ? 3.4 : 2.2) - glow.current.intensity) * k

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

const FLOOR_Y = DESK_DROP - 0.445

function Fog({ view }) {
  const ref = useRef()
  useFrame((frame, delta) => {
    const fog = ref.current
    const goal = view === "room" ? 0.15 : 0.07
    const diff = goal - fog.density
    fog.density += diff * (1 - Math.exp(-0.8 * Math.min(delta, 0.1)))
    if (Math.abs(diff) > 0.0006) frame.invalidate()
  })
  return <fogExp2 ref={ref} attach="fog" args={[FOG, 0.15]} />
}

function Plank({ position, size }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#3b2a1b" roughness={1} />
    </mesh>
  )
}

function Shelf() {
  const boards = [0.04, 0.58, 1.1, 1.6, 1.94]
  return (
    <group position={[2.5, FLOOR_Y, 0.55]} rotation={[0, -Math.PI / 2, 0]}>
      <Plank position={[-0.66, 0.97, 0]} size={[0.04, 1.94, 0.32]} />
      <Plank position={[0.66, 0.97, 0]} size={[0.04, 1.94, 0.32]} />
      {boards.map((y) => (
        <Plank key={y} position={[0, y, 0]} size={[1.34, 0.04, 0.32]} />
      ))}
      <Prop name="Cardboard_Box_02" position={[-0.3, 0.06 + 0.141, 0]} rotation={[0, 0.1, 0]} scale={0.7} />
      <Prop name="Cardboard_Box_03" position={[0.3, 0.06 + 0.212 * 0.55, 0]} rotation={[0, -0.2, 0]} scale={0.55} />
      <Prop name="Cardboard_Box_01" position={[-0.35, 0.6 + 0.107 * 0.8, 0]} rotation={[0, 0.15, 0]} scale={0.8} />
      <Prop name="Box_01" position={[0.1, 0.6 + 0.097, 0]} rotation={[0, -0.3, 0]} />
      <Prop name="Cup_Coffee_01" position={[0.48, 0.6 + 0.08, 0.02]} />
      <Prop name="Alcohol_Bottle_01" position={[-0.45, 1.12, 0]} />
      <Prop name="Alcohol_Bottle_01" position={[-0.28, 1.12, 0.02]} rotation={[0, 1, 0]} />
      <Prop name="Alcohol_Glass_01" position={[-0.06, 1.12, 0]} />
      <Prop name="Folder_01" position={[0.3, 1.12 + 0.013, 0]} rotation={[0, 0.1, 0]} scale={0.8} />
      <Prop name="Folder_02" position={[0.32, 1.12 + 0.04, 0]} rotation={[0, -0.12, 0]} scale={0.7} />
      <Prop name="Paper_Pile_01" position={[-0.3, 1.62 - 0.012, 0]} rotation={[0, 0.3, 0]} scale={0.8} />
      <Prop name="Folder_02" position={[0.2, 1.62 + 0.004, 0]} rotation={[0, 0.2, 0]} />
      <Prop name="Cigarette_Tray_01" position={[0.5, 1.62 + 0.024, 0]} scale={0.8} />
      <pointLight color="#ffb766" position={[-0.9, 1.1, 0.7]} intensity={0.9} distance={2.2} decay={2} />
    </group>
  )
}
function Bin() {
  return (
    <group position={[1.18, FLOOR_Y, 0.15]}>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.34, 18, 1, true]} />
        <meshStandardMaterial color="#2c3033" roughness={0.7} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.008, 6, 22]} />
        <meshStandardMaterial color="#3a3f43" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 18]} />
        <meshStandardMaterial color="#1a1c1e" roughness={1} />
      </mesh>
      <Prop name="Paper_Crumpled_01" position={[0.02, 0.3, 0.02]} scale={1.2} />
      <Prop name="Paper_Crumpled_01" position={[-0.06, 0.26, -0.05]} rotation={[0.4, 1, 0]} />
      <Prop name="Paper_Crumpled_01" position={[0.32, 0.05, 0.14]} rotation={[0.2, 2, 0]} />
      <Prop name="Paper_Crumpled_01" position={[0.22, 0.05, -0.2]} rotation={[0.9, 0.4, 0]} />
    </group>
  )
}

const DUST = 170

function Dust() {
  const mesh = useRef()
  const flakes = useMemo(
    () =>
      Array.from({ length: DUST }, () => ({
        x: -3 + Math.random() * 5.6,
        y: FLOOR_Y + Math.random() * 2.6,
        z: -0.7 + Math.random() * 5,
        phase: Math.random() * 100,
        size: 0.004 + Math.random() * 0.009,
        spin: 0.15 + Math.random() * 0.5,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      })),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((frame) => {
    const t = frame.clock.elapsedTime
    flakes.forEach((flake, i) => {
      dummy.position.set(
        flake.x + Math.sin(t * 0.07 + flake.phase) * 0.25,
        flake.y + Math.sin(t * 0.05 + flake.phase * 1.7) * 0.15 + ((t * 0.012 + flake.phase) % 0.3),
        flake.z + Math.cos(t * 0.06 + flake.phase) * 0.25,
      )
      dummy.quaternion.setFromAxisAngle(flake.axis, t * flake.spin + flake.phase)
      dummy.scale.setScalar(flake.size)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    frame.invalidate()
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DUST]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#d9c6a0" transparent opacity={0.6} depthWrite={false} />
    </instancedMesh>
  )
}
function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -0.5]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#3a2a1c" roughness={1} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 2.2, -0.78]}>
        <planeGeometry args={[14, 4.4]} />
        <meshStandardMaterial color="#4a4036" roughness={1} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 0.12, -0.77]}>
        <boxGeometry args={[14, 0.24, 0.03]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      <group position={[1.62, 1.1, -0.76]}>
        <mesh>
          <boxGeometry args={[0.96, 1.26, 0.05]} />
          <meshStandardMaterial color="#17110b" roughness={1} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.8, 1.1]} />
          <meshStandardMaterial color="#0d1626" emissive="#7f98c4" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.04, 1.1, 0.02]} />
          <meshStandardMaterial color="#17110b" roughness={1} />
        </mesh>
        <mesh position={[0, 0.1, 0.045]}>
          <boxGeometry args={[0.8, 0.04, 0.02]} />
          <meshStandardMaterial color="#17110b" roughness={1} />
        </mesh>
      </group>
      <mesh position={[-3.4, FLOOR_Y + 2.2, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 4.4]} />
        <meshStandardMaterial color="#413830" roughness={1} />
      </mesh>
      <mesh position={[-3.38, FLOOR_Y + 0.12, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.24, 0.03]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      <Prop name="Cardboard_Box_02" position={[-3.0, FLOOR_Y + 0.141, 0.9]} rotation={[0, 1.2, 0]} />
      <Prop name="Cardboard_Box_03" position={[-3.0, FLOOR_Y + 0.212, 1.7]} rotation={[0, 1.7, 0]} />
      <Prop name="Cardboard_Box_01" position={[-2.95, FLOOR_Y + 0.424 + 0.107, 1.7]} rotation={[0, 1.4, 0]} />
      <mesh position={[2.72, FLOOR_Y + 2.2, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[9, 4.4]} />
        <meshStandardMaterial color="#2a221d" roughness={1} />
      </mesh>
      <mesh position={[2.7, FLOOR_Y + 0.12, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.24, 0.03]} />
        <meshStandardMaterial color="#1d1611" roughness={1} />
      </mesh>
      <Shelf />
      <Bin />
      <Prop name="Paper_Pile_01" position={[1.55, FLOOR_Y + 0.0, 0.25]} rotation={[0, 0.8, 0]} scale={1.4} />
      <Prop name="Paper_Pile_01" position={[1.5, FLOOR_Y + 0.2, 0.3]} rotation={[0, -0.4, 0]} scale={1.1} />
      <Prop name="Folder_02" position={[1.4, FLOOR_Y + 0.004, 0.75]} rotation={[0, 0.5, 0]} />
      <Prop name="Folder_01" position={[1.42, FLOOR_Y + 0.028, 0.72]} rotation={[0, 0.2, 0]} />
      <Dust />
      <pointLight color="#7f98c4" position={[1.5, 1.1, -0.2]} intensity={0.6} distance={3} decay={2} />
      <spotLight color="#6f86b3" position={[1.62, 1.5, -0.55]} target-position={[0.9, FLOOR_Y, 1.1]} angle={0.55} penumbra={1} intensity={5} distance={6} decay={2} />
      <Prop name="Armchair_01" position={[0.02, FLOOR_Y + 0.738, 1.0]} rotation={[0, Math.PI - 0.28, 0]} />
      <Prop name="Cardboard_Box_02" position={[-1.75, FLOOR_Y + 0.141, -0.45]} rotation={[0, 0.3, 0]} />
      <Prop name="Cardboard_Box_01" position={[-1.7, FLOOR_Y + 0.141 * 2 + 0.107, -0.5]} rotation={[0, -0.2, 0]} />
      <Prop name="Cardboard_Box_03" position={[-1.2, FLOOR_Y + 0.212, -0.6]} rotation={[0, 0.5, 0]} />
      <Prop name="Box_01" position={[1.55, FLOOR_Y + 0.097, -0.5]} rotation={[0, 0.4, 0]} />
    </group>
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
          <Prop name="Paper_Pile_01" position={[0.45, -0.012, -0.3]} rotation={[0, -0.5, 0]} scale={0.9} />
          <Prop name="Folder_02" position={[0.42, 0.14, -0.31]} rotation={[0, 0.1, 0]} scale={0.8} />
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
  view = "banner",
  room = false,
  onEnter,
}) {
  const wrap = useRef(null)
  const [visible, setVisible] = useState(true)
  const [size, setSize] = useState({ w: 800, h: 360 })
  const still = useMemo(() => prefersStill(), [])
  const narrow = size.w < 640

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
        <color attach="background" args={[room ? FOG : FLOOR]} />
        {room && <Fog view={view} />}
        {room && <Room />}
        <Rig view={view} narrow={narrow} sway={sway} still={still} />
        <Lights
          spots={spots}
          focusIndex={focusIndex >= 0 ? focusIndex : null}
          sweep={sweep}
          mood={mood}
          still={still}
        />
        <group
          onClick={onEnter ? (event) => { event.stopPropagation(); onEnter() } : undefined}
          onPointerOver={onEnter ? () => (document.body.style.cursor = "pointer") : undefined}
          onPointerOut={onEnter ? () => (document.body.style.cursor = "") : undefined}
        >
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
        </group>
      </Canvas>
    </div>
  )
}
