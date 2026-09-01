import { useState } from 'react'
import type { SpeedResult } from '../lib/pqcDemo'

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  if (ms < 1000) return `${ms.toFixed(1)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

interface PqcSpeedCompareProps {
  description: string
  buttonLabel: string
  fetchSpeed: () => Promise<SpeedResult[]>
}

function PqcSpeedCompare({ description, buttonLabel, fetchSpeed }: PqcSpeedCompareProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<SpeedResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)
    try {
      const data = await fetchSpeed()
      setResults(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>{description}</p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Running…' : buttonLabel}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.label}>
              <span className="multibox-label">{r.label}</span>
              <code className="multibox-value">{formatMs(r.ms)}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PqcSpeedCompare
