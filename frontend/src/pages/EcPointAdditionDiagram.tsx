// An original, hand-built illustration of elliptic curve point addition -
// no external image, so no rights to worry about, and labelled to match
// this site's own terminology throughout (P, Q, P+Q, the same names used
// in the ECDH page's exchange-flow table).
//
// Curve: y² = x³ - 4x, chosen purely because it produces the classic
// two-piece elliptic curve shape (an oval plus an unbounded branch) most
// people picture, not because it's used anywhere else on this site.
//
// P=(3, √15) and Q=(-1, √3) were picked directly on the curve, then the
// third intersection of the line through them was found algebraically
// (for a line y=mx+c through two curve points, the sum of all three
// intersection roots equals m² by Vieta's formula), and P+Q is that
// third point reflected over the x-axis - the actual chord-and-tangent
// rule used by every scalarMult call on the ECDH page, not a simplified
// stand-in. Verified in Python before drawing: the third intersection
// and its reflection both satisfy y² = x³ - 4x exactly (see the commit
// that introduced this file for the verification script).
const P = { x: 3, y: Math.sqrt(15) }
const Q = { x: -1, y: Math.sqrt(3) }
const THIRD = { x: -1.7135254915624212, y: 1.3501483220603654 }
const SUM = { x: THIRD.x, y: -THIRD.y } // P + Q

const A = -4
const B = 0

const WIDTH = 360
const HEIGHT = 320
const X_MIN = -2.6
const X_MAX = 3.6
const Y_MIN = -4.4
const Y_MAX = 4.4

function toSvgX(x: number): number {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * WIDTH
}

function toSvgY(y: number): number {
  return HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * HEIGHT
}

function curveBranchPath(xStart: number, xEnd: number, sign: 1 | -1): string {
  const steps = 100
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const x = xStart + ((xEnd - xStart) * i) / steps
    const rhs = x ** 3 + A * x + B
    if (rhs < 0) continue
    const y = sign * Math.sqrt(rhs)
    points.push(`${i === 0 || points.length === 0 ? 'M' : 'L'} ${toSvgX(x)} ${toSvgY(y)}`)
  }
  return points.join(' ')
}

function EcPointAdditionDiagram() {
  // The line through P and Q, drawn edge-to-edge across the plot.
  const slope = (Q.y - P.y) / (Q.x - P.x)
  const intercept = P.y - slope * P.x
  const lineXStart = X_MIN + 0.1
  const lineXEnd = X_MAX - 0.1

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: '100%', maxWidth: 380, height: 'auto' }}
    >
      {/* axes */}
      <line
        x1={0}
        y1={toSvgY(0)}
        x2={WIDTH}
        y2={toSvgY(0)}
        stroke="var(--border)"
      />
      <line
        x1={toSvgX(0)}
        y1={0}
        x2={toSvgX(0)}
        y2={HEIGHT}
        stroke="var(--border)"
      />

      {/* the curve itself, both components */}
      <path
        d={curveBranchPath(-2, 0, 1)}
        fill="none"
        stroke="var(--text-h)"
        strokeWidth={2}
      />
      <path
        d={curveBranchPath(-2, 0, -1)}
        fill="none"
        stroke="var(--text-h)"
        strokeWidth={2}
      />
      <path
        d={curveBranchPath(2, X_MAX - 0.05, 1)}
        fill="none"
        stroke="var(--text-h)"
        strokeWidth={2}
      />
      <path
        d={curveBranchPath(2, X_MAX - 0.05, -1)}
        fill="none"
        stroke="var(--text-h)"
        strokeWidth={2}
      />

      {/* secant line through P and Q, and the dashed reflection line */}
      <line
        x1={toSvgX(lineXStart)}
        y1={toSvgY(slope * lineXStart + intercept)}
        x2={toSvgX(lineXEnd)}
        y2={toSvgY(slope * lineXEnd + intercept)}
        stroke="#2f7de1"
        strokeWidth={1.5}
      />
      <line
        x1={toSvgX(THIRD.x)}
        y1={toSvgY(THIRD.y)}
        x2={toSvgX(SUM.x)}
        y2={toSvgY(SUM.y)}
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* points */}
      {[
        { p: P, label: 'P', color: '#2f7de1', dx: 8, dy: -6 },
        { p: Q, label: 'Q', color: '#2f7de1', dx: -18, dy: -8 },
        { p: THIRD, label: '', color: 'var(--text)', dx: 0, dy: 0 },
        { p: SUM, label: 'P + Q', color: 'var(--accent)', dx: 8, dy: 14 },
      ].map(({ p, label, color, dx, dy }) => (
        <g key={label || `${p.x}-${p.y}`}>
          <circle cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={4} fill={color} />
          {label && (
            <text
              x={toSvgX(p.x) + dx}
              y={toSvgY(p.y) + dy}
              fontSize={13}
              fontWeight={600}
              fill={color}
            >
              {label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default EcPointAdditionDiagram
