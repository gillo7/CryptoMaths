import { useState } from 'react'

interface AlgoResult {
  label: string
  bits: number
  keygenMs: number
}

interface SpeedResult {
  rsa: AlgoResult | null
  ecdsa: AlgoResult | null
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
        level - how long does each actually take to generate a key?
      </p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Generating keys…'
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
        </div>
      )}
    </div>
  )
}

export default RsaEccSpeed
