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

// Valid, non-degenerate secrets: 1 through order-1. 0 would make a public
// key the point at infinity outright, and since the group has prime
// order, any product of two values in this range is itself never a
// multiple of the order - so the shared secret can never land on
// infinity either. Every selectable value here always produces a
// sensible result, rather than technically-correct-but-confusing edge
// cases the reader has to have explained to them.
const SECRET_OPTIONS = Array.from({ length: Number(CURVE_ORDER) - 1 }, (_, i) => i + 1)

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

function FieldCurvePlot({ highlights }: { highlights: HighlightedPoint[] }) {
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
  const [secretA, setSecretA] = useState(6)
  const [secretB, setSecretB] = useState(9)

  const A = scalarMult(BigInt(secretA), GENERATOR)
  const B = scalarMult(BigInt(secretB), GENERATOR)
  const aliceShared = scalarMult(BigInt(secretA), B)
  const bobShared = scalarMult(BigInt(secretB), A)
  const match =
    aliceShared === null || bobShared === null
      ? aliceShared === bobShared
      : aliceShared.x === bobShared.x && aliceShared.y === bobShared.y

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <p className="demo-note">
        A small real curve, y² = x³ + {CURVE_A.toString()}x +{' '}
        {CURVE_B.toString()} mod {CURVE_P.toString()}, generator G ={' '}
        {formatPoint(GENERATOR)} - every dot below is a genuine point on
        it, computed directly from the equation. Pick your own secrets
        for a and b:
      </p>

      <div className="cost-selector">
        {SECRET_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSecretA(value)}
            className={
              value === secretA ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            a={value}
          </button>
        ))}
      </div>
      <div className="cost-selector">
        {SECRET_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSecretB(value)}
            className={
              value === secretB ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            b={value}
          </button>
        ))}
      </div>

      <FieldCurvePlot
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
          <code className="multibox-value">
            A = {secretA} × G = {formatPoint(A)}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob's public key</span>
          <code className="multibox-value">
            B = {secretB} × G = {formatPoint(B)}
          </code>
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
      </p>
    </div>
  )
}

export default EcdhToyCalculator
