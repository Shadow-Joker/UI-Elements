import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface RobotModelProps {
  rotationRef: React.MutableRefObject<{ x: number; y: number }>
  hovered: boolean
  idleTime: React.MutableRefObject<number>
}

export function RobotModel({ rotationRef, hovered, idleTime }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const scaleRef = useRef(1)

  useFrame((_, delta) => {
    idleTime.current += delta
    const g = groupRef.current
    if (!g) return

    /* User rotation */
    g.rotation.y = rotationRef.current.y
    g.rotation.x = rotationRef.current.x

    /* Idle float + gentle sway */
    g.position.y = Math.sin(idleTime.current * 0.6) * 0.04
    g.rotation.y += Math.sin(idleTime.current * 0.3) * 0.015

    /* Hover scale spring */
    const targetScale = hovered ? 1.03 : 1.0
    scaleRef.current += (targetScale - scaleRef.current) * 0.08
    g.scale.setScalar(scaleRef.current)
  })

  /*
   * MATERIALS DESIGNED SPECIFICALLY FOR ASCII LUMINANCE MAPPING:
   * Body & Pedestal: Bright neutral tones so WebGL outputs high luminance -> dense ASCII chars.
   * Screen: Very dark tone so WebGL outputs low luminance -> sparse dot pattern.
   * Eyes & Highlights: Pure white emissive -> maximum ASCII density (+000+).
   */

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>

      {/* ── Main Body (Rounded & Solid) ────────────────────── */}
      <RoundedBox args={[2.1, 2.3, 1.7]} radius={0.52} smoothness={6} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#9aa0bc" roughness={0.4} metalness={0.2} />
      </RoundedBox>

      {/* ── Face Bezel / Frame ────────────────────────────── */}
      <RoundedBox args={[1.55, 1.55, 0.15]} radius={0.34} smoothness={5} position={[0, 0.22, 0.80]}>
        <meshStandardMaterial color="#b0b6d4" roughness={0.3} metalness={0.3} />
      </RoundedBox>

      {/* ── Inner Screen (Dark cutout area like reference) ──── */}
      <RoundedBox args={[1.42, 1.42, 0.16]} radius={0.30} smoothness={5} position={[0, 0.22, 0.82]}>
        <meshStandardMaterial color="#080a12" roughness={0.9} metalness={0.0} />
      </RoundedBox>

      {/* ── Left Eye (Bright vertical capsule) ──────────────── */}
      <RoundedBox args={[0.24, 0.50, 0.10]} radius={0.10} smoothness={4} position={[-0.30, 0.22, 0.92]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
      </RoundedBox>

      {/* ── Right Eye (Bright vertical capsule) ─────────────── */}
      <RoundedBox args={[0.24, 0.50, 0.10]} radius={0.10} smoothness={4} position={[0.30, 0.22, 0.92]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
      </RoundedBox>

      {/* ── Left Antenna (Top cylinder + base collar ring) ──── */}
      <group position={[-0.60, 1.35, 0.0]} rotation={[0, 0, -0.32]}>
        {/* Antenna Base Collar */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.36, 0.40, 0.12, 32]} />
          <meshStandardMaterial color="#b4bae0" roughness={0.3} />
        </mesh>
        {/* Antenna Top Cylinder */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.30, 0.32, 0.55, 32]} />
          <meshStandardMaterial color="#949ab8" roughness={0.4} />
        </mesh>
      </group>

      {/* ── Right Antenna (Top cylinder + base collar ring) ─── */}
      <group position={[0.60, 1.35, 0.0]} rotation={[0, 0, 0.32]}>
        {/* Antenna Base Collar */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.36, 0.40, 0.12, 32]} />
          <meshStandardMaterial color="#b4bae0" roughness={0.3} />
        </mesh>
        {/* Antenna Top Cylinder */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.30, 0.32, 0.55, 32]} />
          <meshStandardMaterial color="#949ab8" roughness={0.4} />
        </mesh>
      </group>

      {/* ── Left Arm (Side flipper/capsule) ────────────────── */}
      <group position={[-1.24, -0.10, 0.1]} rotation={[0, 0, 0.32]}>
        <RoundedBox args={[0.52, 0.85, 0.58]} radius={0.24} smoothness={4}>
          <meshStandardMaterial color="#8a90ac" roughness={0.4} />
        </RoundedBox>
      </group>

      {/* ── Right Arm (Side flipper/capsule) ───────────────── */}
      <group position={[1.24, -0.10, 0.1]} rotation={[0, 0, -0.32]}>
        <RoundedBox args={[0.52, 0.85, 0.58]} radius={0.24} smoothness={4}>
          <meshStandardMaterial color="#8a90ac" roughness={0.4} />
        </RoundedBox>
      </group>

      {/* ── Chest Detail (Horizontal pill bar) ──────────────── */}
      <RoundedBox args={[0.78, 0.24, 0.10]} radius={0.10} smoothness={4} position={[0, -0.62, 0.87]}>
        <meshStandardMaterial color="#c0c6e8" roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.70, 0.18, 0.11]} radius={0.08} smoothness={4} position={[0, -0.62, 0.88]}>
        <meshStandardMaterial color="#10121c" roughness={0.8} />
      </RoundedBox>

      {/* ── Pedestal Platform (Wide 3D cylinder disc at base) ── */}
      <group position={[0, -1.35, 0]}>
        {/* Upper Rim */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.55, 1.62, 0.14, 64]} />
          <meshStandardMaterial color="#abb2d2" roughness={0.3} />
        </mesh>
        {/* Base Cylinder */}
        <mesh position={[0, -0.10, 0]}>
          <cylinderGeometry args={[1.65, 1.70, 0.32, 64]} />
          <meshStandardMaterial color="#8288a4" roughness={0.5} />
        </mesh>
      </group>

    </group>
  )
}
