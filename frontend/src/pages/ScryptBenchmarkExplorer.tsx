import { useState } from 'react'
import { scrypt, sha256 } from 'hash-wasm'

const FAST_ITERATIONS = 3000
const SCRYPT_ITERATIONS = 3
const SCRYPT_COSTS = [1024, 16384, 65536]
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

function ScryptBenchmarkExplorer() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [results, setResults] = useState<BenchResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)

    const sha256Ms = await timeHash(() => sha256(SAMPLE_TEXT), FAST_ITERATIONS)

    const scryptResults: BenchResult[] = []
    for (const N of SCRYPT_COSTS) {
      const ms = await timeHash(
        () =>
          scrypt({
            password: SAMPLE_TEXT,
            salt: crypto.getRandomValues(new Uint8Array(16)),
            costFactor: N,
            blockSize: 8,
            parallelism: 1,
            hashLength: 32,
            outputType: 'hex',
          }),
        SCRYPT_ITERATIONS,
      )
      scryptResults.push({
        label: `Scrypt (N=${N.toLocaleString()})`,
        msPerHash: ms,
      })
    }

    setResults([{ label: 'SHA-256', msPerHash: sha256Ms }, ...scryptResults])
    setStatus('idle')
  }

  const sha256Ms = results?.find((r) => r.label === 'SHA-256')?.msPerHash ?? 0

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
                {r.label === 'SHA-256' && ' (baseline)'}
                {r.label.startsWith('Scrypt') &&
                  ` (${Math.round(r.msPerHash / sha256Ms).toLocaleString()}x slower than SHA-256)`}
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

export default ScryptBenchmarkExplorer
