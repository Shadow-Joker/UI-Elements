import { useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
 * ASCII Density Ramp tailored to recreate the exact aesthetic of the reference:
 * - Background (lum < 0.04) -> ' ' (empty space)
 * - Screen / Deep Shadow (0.04 - 0.18) -> '.' and ':' (sparse dots)
 * - Body surface (0.18 - 0.70) -> 'i', 'l', '1', 'o', '0', 'c', 'v', 'u', '=', 'x', 'a'
 * - Highlights / Eyes (lum > 0.70) -> '+', '*', '#', '%', '@', 'W', '8'
 */
const RAMP = "  ..::--==+*#%@W8$"

function luminanceToChar(lum: number): string {
  if (lum < 0.035) return ' '
  if (lum < 0.10) return '.'
  if (lum < 0.18) return ':'
  if (lum < 0.28) return 'i'
  if (lum < 0.38) return 'l'
  if (lum < 0.48) return '1'
  if (lum < 0.58) return 'o'
  if (lum < 0.68) return '0'
  if (lum < 0.78) return '+'
  if (lum < 0.88) return '#'
  return '@'
}

interface AsciiRendererProps {
  cols: number
  rows: number
  preRef: React.RefObject<HTMLPreElement | null>
}

export function AsciiRenderer({ cols, rows, preRef }: AsciiRendererProps) {
  const { gl, scene, camera } = useThree()

  /* Off-screen WebGL Render Target */
  const rt = useMemo(() => new THREE.WebGLRenderTarget(cols * 2, rows * 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  }), [cols, rows])

  /* Pixel Buffer */
  const pixelBuffer = useMemo(
    () => new Uint8Array(cols * 2 * rows * 2 * 4),
    [cols, rows]
  )

  useEffect(() => () => rt.dispose(), [rt])

  useFrame(() => {
    /* 1. Render scene to off-screen target */
    const prevTarget = gl.getRenderTarget()
    gl.setRenderTarget(rt)
    gl.render(scene, camera)
    gl.setRenderTarget(prevTarget)

    /* 2. Read pixels from buffer */
    gl.readRenderTargetPixels(rt, 0, 0, cols * 2, rows * 2, pixelBuffer)

    /* 3. Convert pixels to ASCII grid */
    const rtW = cols * 2
    const rtH = rows * 2
    const lines: string[] = []

    for (let row = 0; row < rows; row++) {
      let line = ''
      for (let col = 0; col < cols; col++) {
        /* WebGL origin is bottom-left; flip Y */
        const px = col * 2
        const py = rtH - 1 - row * 2
        const idx = (py * rtW + px) * 4
        const r = pixelBuffer[idx]     / 255
        const g = pixelBuffer[idx + 1] / 255
        const b = pixelBuffer[idx + 2] / 255

        /* Perceptual luminance calculation */
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        line += luminanceToChar(lum)
      }
      lines.push(line)
    }

    /* 4. Output string into pre tag */
    if (preRef.current) {
      preRef.current.textContent = lines.join('\n')
    }
  })

  return null
}
