import { useState } from 'react'
import { measureCurveSpeed, type CurveSpeedResult } from '../lib/curveCompareDemo'

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  return `${ms.toFixed(1)} ms`
}

function CurveSpeedCompare() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<CurveSpeedResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)
    try {
      const data = await measureCurveSpeed()
      const sorted = [...data].sort((a, b) => a.ms - b.ms)
      setResults(sorted)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>How long each curve actually takes to generate a key, on this server:</p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Generating…' : 'Run a live speed test on the server'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.curve}>
              <span className="multibox-label">{r.curve}</span>
              <code className="multibox-value">{formatMs(r.ms)}</code>
            </div>
          ))}
        </div>
      )}

      {results && (
        <p className="demo-note">
          Bigger curves cost a bit more, a real and consistent pattern,
          not noise, but every one of them is still tiny next to RSA's
          keygen time seen earlier in this chapter.
        </p>
      )}
    </div>
  )
}

export default CurveSpeedCompare
