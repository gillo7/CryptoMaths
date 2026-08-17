import { useState } from 'react'
import { bcrypt, md5, sha256 } from 'hash-wasm'

const FAST_ITERATIONS = 3000
const BCRYPT_ITERATIONS = 2
const BCRYPT_COSTS = [10, 12, 14]
const SAMPLE_TEXT = 'Cipher'

interface BenchResult {
  label: string
  msPerHash: number
}

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(1)} µs`
  return `${ms.toFixed(1)} ms`
}

async function timeHash(fn: () => Promise<string>, iterations: number) {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    await fn()
  }
  return (performance.now() - start) / iterations
}

function BenchmarkExplorer() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [results, setResults] = useState<BenchResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)

    const md5Ms = await timeHash(() => md5(SAMPLE_TEXT), FAST_ITERATIONS)
    const sha256Ms = await timeHash(() => sha256(SAMPLE_TEXT), FAST_ITERATIONS)

    const bcryptResults: BenchResult[] = []
    for (const cost of BCRYPT_COSTS) {
      const ms = await timeHash(
        () =>
          bcrypt({
            password: SAMPLE_TEXT,
            salt: crypto.getRandomValues(new Uint8Array(16)),
            costFactor: cost,
            outputType: 'encoded',
          }),
        BCRYPT_ITERATIONS,
      )
      bcryptResults.push({ label: `Bcrypt (cost ${cost})`, msPerHash: ms })
    }

    setResults([
      { label: 'MD5', msPerHash: md5Ms },
      { label: 'SHA-256', msPerHash: sha256Ms },
      ...bcryptResults,
    ])
    setStatus('idle')
  }

  const md5Ms = results?.find((r) => r.label === 'MD5')?.msPerHash ?? 0

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Benchmarking…'
          : 'Run a benchmark on this device'}
      </button>

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.label}>
              <span className="multibox-label">{r.label}</span>
              <code className="multibox-value">
                {formatMs(r.msPerHash)}
                {r.label === 'MD5' && ' (baseline)'}
                {r.label.startsWith('Bcrypt') &&
                  ` (${Math.round(r.msPerHash / md5Ms).toLocaleString()}x slower than MD5)`}
              </code>
            </div>
          ))}
        </div>
      )}

      {results && (
        <p className="demo-note">
          Measured live in your browser, right now - not a fixed number.
        </p>
      )}
    </div>
  )
}

export default BenchmarkExplorer
