import { useState } from 'react'

interface AlgoResult {
  label: string
  bits: number
  signPerSec: number
  verifyPerSec: number
  keygenMs: number
}

interface SpeedResult {
  rsa: AlgoResult | null
  ecdsa: AlgoResult | null
}

function formatOpsPerSec(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ops/s`
}

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  if (ms < 1000) return `${ms.toFixed(1)} ms`
  return `${(ms / 1000).toFixed(2)} s`
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
          ? 'Benchmarking (takes 10-15 seconds - RSA key generation is the slow part)…'
          : 'Run a live speed test on the server'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result?.rsa && result.ecdsa && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">RSA-2048 keygen</span>
            <code className="multibox-value">
              {formatMs(result.rsa.keygenMs)}
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">ECDSA P-256 keygen</span>
            <code className="multibox-value">
              {formatMs(result.ecdsa.keygenMs)}
            </code>
          </div>
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
          Key generation is where the gap is starkest:{' '}
          {Math.round(
            result.rsa.keygenMs / result.ecdsa.keygenMs,
          ).toLocaleString()}
          x slower for RSA-2048, because it has to search for two large
          random primes, real, variable-cost work, exactly what the RSA
          key generation section above walked through. ECDSA just picks a
          random scalar against an already-defined curve. ECDSA also
          signs about{' '}
          {Math.round(
            result.ecdsa.signPerSec / result.rsa.signPerSec,
          ).toLocaleString()}
          x faster, with a key 8x smaller - though RSA still wins at
          verification, the operation that only needs the small public
          exponent e.
        </p>
      )}
    </div>
  )
}

export default RsaEccSpeed
