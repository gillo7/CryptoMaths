import { useState } from 'react'

interface AlgoResult {
  label: string
  bits: number
  signPerSec: number
  verifyPerSec: number
}

interface SpeedResult {
  rsa: AlgoResult | null
  ecdsa: AlgoResult | null
}

function formatOpsPerSec(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ops/s`
}

function RsaEccSpeed() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<SpeedResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const response = await fetch('/api/rsa/speed', { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.rsa || !data.ecdsa) throw new Error()
      setResult(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>
        RSA-2048 and ECDSA P-256 are roughly the same real-world security
        level - this measures what that trade actually costs.
      </p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Benchmarking (takes a few seconds)…'
          : 'Run a live speed test on the server'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result?.rsa && result.ecdsa && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">RSA-2048 sign</span>
            <code className="multibox-value">
              {formatOpsPerSec(result.rsa.signPerSec)}
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">RSA-2048 verify</span>
            <code className="multibox-value">
              {formatOpsPerSec(result.rsa.verifyPerSec)}
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">ECDSA P-256 sign</span>
            <code className="multibox-value">
              {formatOpsPerSec(result.ecdsa.signPerSec)}
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">ECDSA P-256 verify</span>
            <code className="multibox-value">
              {formatOpsPerSec(result.ecdsa.verifyPerSec)}
            </code>
          </div>
        </div>
      )}

      {result?.rsa && result.ecdsa && (
        <p className="demo-note">
          ECDSA signs about{' '}
          {Math.round(
            result.ecdsa.signPerSec / result.rsa.signPerSec,
          ).toLocaleString()}
          x faster than RSA-2048 here, with a key 8x smaller. RSA still
          wins at verification, the operation that only needs the small
          public exponent e - it's specifically the private-key operation
          (sign, or decrypt) that a 2048-bit modulus makes expensive.
        </p>
      )}
    </div>
  )
}

export default RsaEccSpeed
