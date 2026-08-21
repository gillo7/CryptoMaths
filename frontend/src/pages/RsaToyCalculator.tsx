import { useState } from 'react'

// Small enough that N stays a few hundred at most, keeping this a toy
// like the worked example above, not a real key size.
const PRIME_OPTIONS = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
const MAX_M = 9999

// These four prime pairs give a PHI (8, 12, or 24) whose entire group of
// units has every element self-inverse - there is no possible e for them
// with a genuinely different d, not just an unlucky choice of e. Rather
// than land a reader on a public and private key that are the same
// number, these combinations are disabled rather than picked around.
const DEGENERATE_PAIRS = [
  [3, 5],
  [3, 7],
  [3, 13],
  [5, 7],
]

function isDegeneratePair(a: number, b: number): boolean {
  return DEGENERATE_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  )
}

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join('')
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// Extended Euclidean algorithm - finds d such that (d * e) mod phi = 1,
// the same modular inverse described in the text above, just computed
// instead of solved by hand.
function modInverse(e: number, phi: number): number {
  let [oldR, r] = [e, phi]
  let [oldS, s] = [1, 0]
  while (r !== 0) {
    const quotient = Math.floor(oldR / r)
    ;[oldR, r] = [r, oldR - quotient * r]
    ;[oldS, s] = [s, oldS - quotient * s]
  }
  return ((oldS % phi) + phi) % phi
}

// Smallest e >= 3 that shares no common factor with PHI - mirrors the
// worked example's own reasoning ("e = 3, shares no common factor with
// 20"), just applied automatically since PHI changes with every p/q pick.
// Also skips any e that happens to be its own modular inverse (e === d):
// mathematically valid, but a confusing accident for a demo whose whole
// point is that the public and private keys are different numbers. For
// four specific prime pairs (giving PHI = 8, 12, or 24) every unit in
// that group is self-inverse, so no such e exists at all - those fall
// back to the first valid pair, since there's genuinely no alternative.
function findKeyPair(phi: number): { e: number; d: number } {
  let fallback: { e: number; d: number } | null = null
  for (let e = 3; e < phi; e++) {
    if (gcd(e, phi) !== 1) continue
    const d = modInverse(e, phi)
    if (!fallback) fallback = { e, d }
    if (d !== e) return { e, d }
  }
  return fallback ?? { e: 1, d: 1 }
}

// Square-and-multiply modular exponentiation via BigInt. Needed even at
// this toy scale: once e or d isn't the fixed worked-example's small 3/7,
// they can land anywhere up to a few hundred, and naive base ** exponent
// on regular JS numbers overflows to Infinity long before the % N ever
// gets applied. BigInt alone isn't enough either - base ** exponent would
// still build the full, enormous intermediate value first; this reduces
// modulo N at every step instead, so it never grows large in the first
// place.
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n
  let result = 1n
  base = base % modulus
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus
    exponent = exponent / 2n
    base = (base * base) % modulus
  }
  return result
}

function RsaToyCalculator() {
  const [p, setP] = useState(3)
  const [q, setQ] = useState(11)
  const [input, setInput] = useState('5')

  const n = p * q
  const phi = (p - 1) * (q - 1)
  const { e, d } = findKeyPair(phi)

  const m = Math.max(0, Math.min(MAX_M, Math.trunc(Number(input)) || 0))
  const c = Number(modPow(BigInt(m), BigInt(e), BigInt(n)))
  const recovered = Number(modPow(BigInt(c), BigInt(d), BigInt(n)))
  const wrapsAround = m >= n

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <p className="demo-note">Pick p and q to build your own toy key:</p>
      <div className="cost-selector">
        {PRIME_OPTIONS.map((prime) => (
          <button
            key={prime}
            type="button"
            onClick={() => setP(prime)}
            disabled={prime === q || isDegeneratePair(prime, q)}
            className={
              prime === p ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            p={prime}
          </button>
        ))}
      </div>
      <div className="cost-selector">
        {PRIME_OPTIONS.map((prime) => (
          <button
            key={prime}
            type="button"
            onClick={() => setQ(prime)}
            disabled={prime === p || isDegeneratePair(p, prime)}
            className={
              prime === q ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            q={prime}
          </button>
        ))}
      </div>
      <p className="demo-note">
        Greyed-out values are unavailable: p and q can't be the same
        prime, and a few specific pairs are disabled because their maths
        makes e and d come out identical, which would make the public and
        private key the same number - a confusing accident, not a real
        RSA property.
      </p>

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">N = p × q</span>
          <code className="multibox-value">
            {p} × {q} = {n}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">PHI</span>
          <code className="multibox-value">
            ({p}-1)({q}-1) = {phi}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">e</span>
          <code className="multibox-value">
            {e} (smallest value coprime with {phi})
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">d</span>
          <code className="multibox-value">
            {d}, since ({d} × {e}) mod {phi} = 1
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Public key</span>
          <code className="multibox-value">
            [e, N] = [{e}, {n}]
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Private key</span>
          <code className="multibox-value">
            [d, N] = [{d}, {n}]
          </code>
        </div>
      </div>

      <input
        type="number"
        min={0}
        max={MAX_M}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Pick a value for M…"
        className="explorer-input"
      />

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">M</span>
          <code className="multibox-value">{m}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Encrypting</span>
          <code className="multibox-value">
            C = {m}
            {toSuperscript(e)} mod {n} = {c}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Decrypting</span>
          <code className="multibox-value">
            M = {c}
            {toSuperscript(d)} mod {n} = {recovered}
          </code>
        </div>
      </div>

      {wrapsAround ? (
        <p className="hash-result">
          M ({m}) is not smaller than N ({n}), so it wraps around: {m} mod{' '}
          {n} = {m % n}, and that's what comes back out instead of {m} -
          exactly the failure mode described above.
        </p>
      ) : (
        <p className="demo-note">
          Try a value of {n} or higher for M to see that failure mode
          happen yourself.
        </p>
      )}
    </div>
  )
}

export default RsaToyCalculator
