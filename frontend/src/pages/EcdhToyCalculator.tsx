import { useState } from 'react'
import {
  CURVE_A,
  CURVE_B,
  CURVE_ORDER,
  CURVE_P,
  curvePoints,
  formatPoint,
  GENERATOR,
  type Point,
  scalarMult,
} from '../lib/ecdhDemo'

const MAX_SECRET = 9999
const PLOT_SIZE = 240
const MARGIN = 20
const MAX_COORD = Number(CURVE_P) - 1
const CELL = (PLOT_SIZE - 2 * MARGIN) / MAX_COORD

function toSvgX(x: bigint): number {
  return MARGIN + Number(x) * CELL
}

function toSvgY(y: bigint): number {
  return PLOT_SIZE - MARGIN - Number(y) * CELL
}

const ALL_POINTS = curvePoints()

interface HighlightedPoint {
  point: Point
  label: string
  color: string
}

function CurvePlot({ highlights }: { highlights: HighlightedPoint[] }) {
  return (
    <svg
      viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
      style={{ width: '100%', maxWidth: 280, height: 'auto' }}
    >
      {ALL_POINTS.map((p) => (
        <circle
          key={`${p.x}-${p.y}`}
          cx={toSvgX(p.x)}
          cy={toSvgY(p.y)}
          r={3}
          fill="var(--border)"
        />
      ))}
      {highlights.map(({ point, label, color }) => {
        if (point === null) return null
        return (
          <g key={label}>
            <circle cx={toSvgX(point.x)} cy={toSvgY(point.y)} r={5} fill={color} />
            <text
              x={toSvgX(point.x) + 7}
              y={toSvgY(point.y) - 6}
              fontSize={11}
              fill={color}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function EcdhToyCalculator() {
  const [secretInputA, setSecretInputA] = useState('6')
  const [secretInputB, setSecretInputB] = useState('9')

  const a = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputA)) || 0))
  const b = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputB)) || 0))

  const A = scalarMult(BigInt(a), GENERATOR)
  const B = scalarMult(BigInt(b), GENERATOR)
  const aliceShared = scalarMult(BigInt(a), B)
  const bobShared = scalarMult(BigInt(b), A)
  const match =
    aliceShared === null || bobShared === null
      ? aliceShared === bobShared
      : aliceShared.x === bobShared.x && aliceShared.y === bobShared.y

  const aIsMultipleOfOrder = BigInt(a) % CURVE_ORDER === 0n
  const bIsMultipleOfOrder = BigInt(b) % CURVE_ORDER === 0n

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <p className="demo-note">
        A small real curve, y² = x³ + {CURVE_A.toString()}x +{' '}
        {CURVE_B.toString()} mod {CURVE_P.toString()}, generator G ={' '}
        {formatPoint(GENERATOR)} - every dot below is a genuine point on
        it, plotted directly from the equation. Pick your own secrets for
        a and b:
      </p>

      <div className="hash-input-row">
        <input
          type="number"
          min={0}
          max={MAX_SECRET}
          value={secretInputA}
          onChange={(event) => setSecretInputA(event.target.value)}
          placeholder="Alice's secret (a)…"
          className="explorer-input"
        />
        <input
          type="number"
          min={0}
          max={MAX_SECRET}
          value={secretInputB}
          onChange={(event) => setSecretInputB(event.target.value)}
          placeholder="Bob's secret (b)…"
          className="explorer-input"
        />
      </div>

      <CurvePlot
        highlights={[
          { point: GENERATOR, label: 'G', color: 'var(--text-h)' },
          { point: A, label: 'A', color: '#2f7de1' },
          { point: B, label: 'B', color: '#e0702f' },
          { point: aliceShared, label: 'Shared', color: 'var(--accent)' },
        ]}
      />

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Alice's public key</span>
          <code className="multibox-value">A = {a} × G = {formatPoint(A)}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob's public key</span>
          <code className="multibox-value">B = {b} × G = {formatPoint(B)}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Alice computes</span>
          <code className="multibox-value">
            a × B = {formatPoint(aliceShared)}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob computes</span>
          <code className="multibox-value">
            b × A = {formatPoint(bobShared)}
          </code>
        </div>
      </div>

      <p className="demo-note">
        {match
          ? `Both arrive at the same shared point, ${formatPoint(aliceShared)}, independently - exactly what ECDH guarantees.`
          : "These don't match, which would mean a bug - try different values."}
        {(aIsMultipleOfOrder || bIsMultipleOfOrder) &&
          ` This curve's group has order ${CURVE_ORDER.toString()}, and ${
            aIsMultipleOfOrder && bIsMultipleOfOrder ? 'both a and b are' : aIsMultipleOfOrder ? 'a is' : 'b is'
          } a multiple of it, landing on the point at infinity, the group's identity element, not an error.`}
      </p>
    </div>
  )
}

export default EcdhToyCalculator
