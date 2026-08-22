import { useState } from 'react'
import { measureDhSpeed, type DhSpeedComparison } from '../lib/ecdhSpeedDemo'

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  return `${ms.toFixed(1)} ms`
}

function DhEcdhSpeed() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<DhSpeedComparison | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const data = await measureDhSpeed()
      setResult(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Running…' : 'Run a live speed test on the server'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">{result.dhSharedGroup.label}</span>
            <code className="multibox-value">{formatMs(result.dhSharedGroup.ms)}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">{result.ecdh.label}</span>
            <code className="multibox-value">{formatMs(result.ecdh.ms)}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">{result.dhFreshParams.label}</span>
            <code className="multibox-value">{formatMs(result.dhFreshParams.ms)}</code>
          </div>
        </div>
      )}

      {result && (
        <p className="demo-note">
          The first two are close - reusing a standard group is cheap for
          either algorithm. The third is where classic DH's real
          reputation for slowness comes from: searching for your own safe
          prime, rather than the key exchange itself. That search is
          genuinely random, so this number swings a lot between runs -
          try it a few times.
        </p>
      )}
    </div>
  )
}

export default DhEcdhSpeed
