import type { ReactNode } from 'react'
import { useState } from 'react'

interface BenchResult {
  label: string
  bytesPerSecond: number | null
}

interface BlockCipherBenchmarkProps {
  endpoint?: string
  excludedNote?: ReactNode
}

// Decimal MB, not binary MiB - matches OpenSSL's own speed tool, which
// reports "in 1000s of bytes per second".
function formatThroughput(bytesPerSecond: number): string {
  const mbPerSecond = bytesPerSecond / 1_000_000
  return `${mbPerSecond.toFixed(1)} MB/s`
}

function BlockCipherBenchmark({
  endpoint = '/api/openssl/benchmark',
  excludedNote = (
    <>
      Twofish isn't included: OpenSSL has never implemented it, so there's
      no equivalent measurement to take.
    </>
  ),
}: BlockCipherBenchmarkProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<BenchResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)
    try {
      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data.results)) throw new Error()
      const sorted = [...data.results].sort(
        (a: BenchResult, b: BenchResult) =>
          (b.bytesPerSecond ?? 0) - (a.bytesPerSecond ?? 0),
      )
      setResults(sorted)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>
        How many megabytes per second this server can encrypt with each of
        the following ciphers.
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

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.label}>
              <span className="multibox-label">{r.label}</span>
              <code className="multibox-value">
                {r.bytesPerSecond === null
                  ? 'unavailable'
                  : formatThroughput(r.bytesPerSecond)}
              </code>
            </div>
          ))}
        </div>
      )}

      {results && (
        <p className="demo-note">
          Measured live via OpenSSL's own <code>speed</code> tool, on this
          site's actual server hardware, an ARM chip without AES-NI or any
          equivalent acceleration - it's why AES doesn't run away with this
          benchmark the way it would on most modern laptops or phones.{' '}
          {excludedNote}
        </p>
      )}
    </div>
  )
}

export default BlockCipherBenchmark
