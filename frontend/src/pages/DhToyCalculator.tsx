import { useState } from 'react'

// Matches the worked example above exactly - g and p stay fixed here since
// arbitrary values wouldn't necessarily make g a suitable generator for p
// (unlike RSA's toy calculator, where any two distinct primes work by
// construction). a and b, the two private secrets, are the free inputs.
const G = 2n
const P = 9929n
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
  const [secretInputA, setSecretInputA] = useState('9')
  const [secretInputB, setSecretInputB] = useState('6')

  const a = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputA)) || 0))
  const b = Math.max(0, Math.min(MAX_SECRET, Math.trunc(Number(secretInputB)) || 0))

  const A = modPow(G, BigInt(a), P)
  const B = modPow(G, BigInt(b), P)
  const aliceShared = modPow(B, BigInt(a), P)
  const bobShared = modPow(A, BigInt(b), P)

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <p className="demo-note">
        g = 2, p = 9929, same as the worked example above - pick your own
        secrets for a and b:
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

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Alice's public value</span>
          <code className="multibox-value">
            A = 2{toSuperscript(a)} mod 9929 = {A.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob's public value</span>
          <code className="multibox-value">
            B = 2{toSuperscript(b)} mod 9929 = {B.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Alice computes</span>
          <code className="multibox-value">
            B{toSuperscript(a)} mod 9929 = {aliceShared.toString()}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Bob computes</span>
          <code className="multibox-value">
            A{toSuperscript(b)} mod 9929 = {bobShared.toString()}
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
