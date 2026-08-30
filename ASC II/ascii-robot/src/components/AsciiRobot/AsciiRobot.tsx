import { useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RobotModel } from './RobotModel'
import { AsciiRenderer } from './AsciiRenderer'
import { useAsciiControls } from './AsciiControls'

/* ── High-density resolution matching reference image ───── */
function getResolution() {
  if (typeof window === 'undefined') return { cols: 130, rows: 88 }
  return window.innerWidth < 640
    ? { cols: 80, rows: 54 }
    : { cols: 130, rows: 88 }
}

/* ── Inner R3F scene ─────────────────────────────────────── */
interface SceneProps {
  rotationRef: React.MutableRefObject<{ x: number; y: number }>
  zoomRef:     React.MutableRefObject<number>
  hovered:     boolean
  tick:        () => void
  cols:        number
  rows:        number
  preRef:      React.RefObject<HTMLPreElement | null>
}

function Scene({ rotationRef, zoomRef, hovered, tick, cols, rows, preRef }: SceneProps) {
  const { camera } = useThree()
  const idleTime   = useRef(0)

  useFrame(() => {
    tick()
    /* Smooth zoom by moving camera */
    const cam = camera as THREE.PerspectiveCamera
    cam.position.z += (zoomRef.current - cam.position.z) * 0.1
  })

  return (
    <>
      {/* ── Scene Background: Pure Black for clean ASCII edge ── */}
      <color attach="background" args={['#000000']} />

      {/* ── Lighting Setup tuned for ASCII shading ────────── */}
      <ambientLight intensity={0.45} />
      {/* Key light — Front upper right */}
      <directionalLight position={[3, 4, 4]} intensity={1.8} color="#ffffff" />
      {/* Fill light — Front left */}
      <directionalLight position={[-4, 2, 3]} intensity={1.0} color="#b0c0ff" />
      {/* Rim light — Top back for top edge highlights */}
      <directionalLight position={[0, 5, -3]} intensity={1.2} color="#ffffff" />

      {/* ── 3D Robot Geometry ───────────────────────────────── */}
      <RobotModel rotationRef={rotationRef} hovered={hovered} idleTime={idleTime} />

      {/* ── Off-screen ASCII Post-processor ─────────────────── */}
      <AsciiRenderer cols={cols} rows={rows} preRef={preRef} />
    </>
  )
}

/* ── Main Component ──────────────────────────────────────── */
export function AsciiRobot() {
  const containerRef = useRef<HTMLDivElement>(null!)
  const rotationRef  = useRef({ x: 0, y: 0 })
  const zoomRef      = useRef(4.8)
  const preRef       = useRef<HTMLPreElement | null>(null)

  const [hovered, setHovered] = useState(false)
  const { cols, rows } = useMemo(() => getResolution(), [])

  const { tick, reset } = useAsciiControls({
    rotationRef,
    zoomRef,
    target: containerRef,
    defaultRotation: { x: 0, y: 0 },
    defaultZoom: 4.8,
    zoomMin: 2.5,
    zoomMax: 8,
  })

  const handleReset = useCallback(() => reset(), [reset])

  const cameraProps = useMemo(
    () => ({ position: [0, 0, 4.8] as [number, number, number], fov: 45 }),
    []
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: '#080b12',
        backgroundImage:
          'radial-gradient(ellipse 70% 60% at 50% 40%, #0f1326 0%, #080b12 100%)',
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <header style={{ textAlign: 'center', marginBottom: '20px', userSelect: 'none' }}>
        <h1
          style={{
            fontSize: 'clamp(12px, 1.5vw, 15px)',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#d0d4f0',
            margin: '0 0 6px',
          }}
        >
          ASCII Object Lab
        </h1>
        <p
          style={{
            fontSize: 'clamp(8px, 0.9vw, 10px)',
            letterSpacing: '0.12em',
            color: '#3e4265',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          Interactive Procedural ASCII Element
        </p>
      </header>

      {/* ── Canvas Container ──────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width:  'min(640px, 94vw)',
          height: 'min(540px, 72vw, 72vh)',
          border: '1px solid #181a2e',
          borderRadius: '6px',
          overflow: 'hidden',
          background: '#04050a',
          boxShadow: hovered
            ? '0 0 0 1px #2a2d54, 0 0 48px #0c0f30'
            : '0 0 0 1px #111424',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Hidden WebGL canvas — off-screen rendering only */}
        <Canvas
          camera={cameraProps}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          dpr={1}
        >
          <Scene
            rotationRef={rotationRef}
            zoomRef={zoomRef}
            hovered={hovered}
            tick={tick}
            cols={cols}
            rows={rows}
            preRef={preRef}
          />
        </Canvas>

        {/* ASCII Output Display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <pre
            ref={preRef}
            style={{
              fontFamily: 'inherit',
              fontSize: 'clamp(3.5px, 0.65vw, 7px)',
              lineHeight: '1.14',
              letterSpacing: '0.02em',
              color: hovered ? '#ffffff' : '#d2d6f5',
              textShadow: hovered
                ? '0 0 6px rgba(255, 255, 255, 0.6)'
                : '0 0 3px rgba(180, 190, 240, 0.25)',
              whiteSpace: 'pre',
              userSelect: 'none',
              margin: 0,
              padding: 0,
              transition: 'color 0.3s ease, text-shadow 0.3s ease',
            }}
          />
        </div>

        {/* Corner Ticks */}
        {[
          { top: 10,    left: 12 },
          { top: 10,    right: 12 },
          { bottom: 10, left: 12 },
          { bottom: 10, right: 12 },
        ].map((pos, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              fontSize: '10px',
              color: '#1a1d34',
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            {['┌','┐','└','┘'][i]}
          </span>
        ))}
      </div>

      {/* ── Hint strip ────────────────────────────────────── */}
      <p
        style={{
          marginTop: '16px',
          fontSize: 'clamp(7px, 0.85vw, 9px)',
          letterSpacing: '0.14em',
          color: '#262942',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        Drag to Rotate &nbsp;·&nbsp; Scroll to Zoom
      </p>

      {/* ── Reset Button ──────────────────────────────────── */}
      <button
        onClick={handleReset}
        style={{
          marginTop: '12px',
          padding: '6px 20px',
          background: 'transparent',
          border: '1px solid #1c1f38',
          borderRadius: '4px',
          color: '#343860',
          fontFamily: 'inherit',
          fontSize: 'clamp(8px, 0.85vw, 10px)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#4a4e7a'
          e.currentTarget.style.color = '#8890d0'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#1c1f38'
          e.currentTarget.style.color = '#343860'
        }}
      >
        [ Reset View ]
      </button>
    </div>
  )
}
