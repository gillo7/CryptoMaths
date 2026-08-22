// A small, fully verified toy curve: y² = x³ + 2x + 2 (mod 17). Its 18
// finite points plus the point at infinity give a group of order 19 - a
// prime, so every one of those 18 points is a valid generator, not just
// this specific one. G=(5,1) and everything below was independently
// verified in Python before porting (order of G computed by repeated
// addition = 19; a sample ECDH exchange with secrets 6 and 9 produced the
// same shared point, (10,11), both ways) - see the commit that introduced
// this file for the verification script.
export const CURVE_P = 17n
export const CURVE_A = 2n
export const CURVE_B = 2n
export const GENERATOR: Point = { x: 5n, y: 1n }
export const CURVE_ORDER = 19n

export type Point = { x: bigint; y: bigint } | null // null = point at infinity

function mod(n: bigint, m: bigint): bigint {
  return ((n % m) + m) % m
}

// Modular inverse via the extended Euclidean algorithm - CURVE_P is prime
// here, so Fermat's little theorem would also work, but this doesn't rely
// on primality and matches the modInverse already used elsewhere on this
// site.
function modInverse(k: bigint, m: bigint): bigint {
  let [oldR, r] = [mod(k, m), m]
  let [oldS, s] = [1n, 0n]
  while (r !== 0n) {
    const quotient = oldR / r
    ;[oldR, r] = [r, oldR - quotient * r]
    ;[oldS, s] = [s, oldS - quotient * s]
  }
  return mod(oldS, m)
}

// The standard elliptic curve group law over a prime field: point
// doubling when P equals Q, the chord-and-tangent rule otherwise, and the
// point at infinity acting as the group's identity element.
export function pointAdd(P: Point, Q: Point): Point {
  if (P === null) return Q
  if (Q === null) return P
  if (P.x === Q.x && mod(P.y + Q.y, CURVE_P) === 0n) return null

  const slope =
    P.x === Q.x && P.y === Q.y
      ? mod((3n * P.x * P.x + CURVE_A) * modInverse(2n * P.y, CURVE_P), CURVE_P)
      : mod((Q.y - P.y) * modInverse(Q.x - P.x, CURVE_P), CURVE_P)

  const x3 = mod(slope * slope - P.x - Q.x, CURVE_P)
  const y3 = mod(slope * (P.x - x3) - P.y, CURVE_P)
  return { x: x3, y: y3 }
}

// Double-and-add - the elliptic curve equivalent of square-and-multiply
// for modular exponentiation, and for the same reason: repeated addition
// one step at a time would be correct but far too slow for any real
// scalar.
export function scalarMult(k: bigint, P: Point): Point {
  let result: Point = null
  let addend = P
  let scalar = k
  while (scalar > 0n) {
    if (scalar & 1n) result = pointAdd(result, addend)
    addend = pointAdd(addend, addend)
    scalar >>= 1n
  }
  return result
}

export function formatPoint(P: Point): string {
  return P === null ? '∞ (point at infinity)' : `(${P.x}, ${P.y})`
}

// All finite points on the curve, found by brute force - trivial at this
// size (17×17 candidates), and computing them directly from the curve
// equation rather than hardcoding the list keeps this genuinely derived,
// not just asserted.
export function curvePoints(): { x: bigint; y: bigint }[] {
  const points: { x: bigint; y: bigint }[] = []
  for (let x = 0n; x < CURVE_P; x++) {
    const rhs = mod(x * x * x + CURVE_A * x + CURVE_B, CURVE_P)
    for (let y = 0n; y < CURVE_P; y++) {
      if (mod(y * y, CURVE_P) === rhs) points.push({ x, y })
    }
  }
  return points
}
