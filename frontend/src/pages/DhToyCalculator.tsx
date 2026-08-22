import { useState } from 'react'

// g just needs 1 < g < p for the exchange to work correctly - unlike
// RSA's e, there's no coprimality requirement to satisfy. Restricted to
// the three values the text above calls "typically" used in real DH,
// rather than opened up to any number, so trying each one directly
// reinforces that claim instead of just being an arbitrary free input.
const G_OPTIONS = [2, 3, 5]
// A handful of primes at roughly the worked example's own scale - kept
// modest so the numbers stay approachable, not because larger ones would
// be incorrect.
const P_OPTIONS = [1009, 2039, 4999, 9929]
const MAX_SECRET = 9999

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join('')
}

// Square-and-multiply, same reasoning as the RSA calculator: a or b could
// be large enough that naive g ** a would overflow well before the % p
// ever gets applied.
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  base = base % modulus
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus
    exponent = exponent / 2n
    base = (base * base) % modulus
  }
  return result
}

function DhToyCalculator() {
  const [g, setG] = useState(2)
  const [p, setP] = useState(9929)
  const [secretInputA, setSecretInputA] = useState('9')
  const [secretInputB, setSecretInputB] = useState('6')

  const a = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputA)) || 0))
  const b = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputB)) || 0))

  const A = modPow(BigInt(g), BigInt(a), BigInt(p))
  const B = modPow(BigInt(g), BigInt(b), BigInt(p))
  const aliceShared = modPow(B, BigInt(a), BigInt(p))
  const bobShared = modPow(A, BigInt(b), BigInt(p))

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <p className="demo-note">Pick g and p, then your own secrets for a and b:</p>

      <div className="cost-selector">
        {G_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setG(option)}
            className={
              option === g ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            g={option}
          </button>
        ))}
      </div>
      <div className="cost-selector">
        {P_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setP(option)}
            className={
              option === p ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            p={option}
          </button>
        ))}
      </div>

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

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Alice's public value</span>
          <code className="multibox-value">
            A = {g}
            {toSuperscript(a)} mod {p} = {A.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob's public value</span>
          <code className="multibox-value">
            B = {g}
            {toSuperscript(b)} mod {p} = {B.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Alice computes</span>
          <code className="multibox-value">
            B{toSuperscript(a)} mod {p} = {aliceShared.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob computes</span>
          <code className="multibox-value">
            A{toSuperscript(b)} mod {p} = {bobShared.toString()}
          </code>
        </div>
      </div>

      <p className="demo-note">
        {aliceShared === bobShared
          ? `Both arrive at the same shared secret, ${aliceShared.toString()}, independently - exactly what Diffie-Hellman guarantees.`
          : "These don't match, which would mean a bug - try different values."}
      </p>
    </div>
  )
}

export default DhToyCalculator
