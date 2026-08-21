import { useState } from 'react'

// Fixed toy key matching the worked example above exactly: p=3, q=11,
// N=33, e=3, d=7. Only M is selectable - deliberately not upgraded to
// real modular exponentiation (that's the point of the pow(m,e,n) vs
// naive timing demo further down), since e=3 makes even the naive
// M**e % N approach instant for any M a reader would type here.
const N = 33
const E = 3
const D = 7
const MAX_M = 9999

function RsaToyCalculator() {
  const [input, setInput] = useState('5')
  const m = Math.max(0, Math.min(MAX_M, Math.trunc(Number(input)) || 0))
  const mCubed = m ** E
  const c = mCubed % N
  const cToSeventh = c ** D
  const recovered = cToSeventh % N
  const wrapsAround = m >= N

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

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
            C = {m}³ mod 33 = {mCubed} mod 33 = {c}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Decrypting</span>
          <code className="multibox-value">
            M = {c}⁷ mod 33 = {cToSeventh} mod 33 = {recovered}
          </code>
        </div>
      </div>

      {wrapsAround ? (
        <p className="hash-result">
          M ({m}) is not smaller than N (33), so it wraps around: {m} mod
          33 = {m % N}, and that's what comes back out instead of {m} -
          exactly the failure mode described above.
        </p>
      ) : (
        <p className="demo-note">
          Try a value of 33 or higher for M to see that failure mode
          happen yourself.
        </p>
      )}
    </div>
  )
}

export default RsaToyCalculator
