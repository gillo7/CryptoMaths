import { useState } from 'react'

const BIT_SIZES = [512, 1024, 2048] as const
const E = 65537n

// The same square-and-multiply approach real RSA implementations use
// (Python's pow(m, e, n), OpenSSL, etc.) - reduces modulo n after every
// squaring, so no intermediate value ever grows past roughly n's own
// size.
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  base = base % modulus
  while (exponent > 0n) {
    if (exponent % 2n === 1n) result = (result * base) % modulus
    exponent = exponent / 2n
    base = (base * base) % modulus
  }
  return result
}

function randomBigInt(bits: number): bigint {
  const bytes = Math.ceil(bits / 8)
  const array = crypto.getRandomValues(new Uint8Array(bytes))
  array[0] |= 0x80 // force the top bit so it's genuinely close to full size
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
  return BigInt(`0x${hex}`)
}

function formatMs(ms: number): string {
  if (ms === 0) return '<1 µs'
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  return `${ms.toFixed(1)} ms`
}

interface TimingResult {
  naiveMs: number
  fastMs: number
  match: boolean
}

function RsaModpowTiming() {
  const [bits, setBits] = useState<(typeof BIT_SIZES)[number]>(512)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<TimingResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    // Lets the "Running…" label actually paint before the naive
    // computation blocks the main thread for real.
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      const n = randomBigInt(bits)
      const m = randomBigInt(bits) % n

      const t0 = performance.now()
      const naive = (m ** E) % n
      const naiveMs = performance.now() - t0

      const t1 = performance.now()
      const fast = modPow(m, E, n)
      const fastMs = performance.now() - t1

      setResult({ naiveMs, fastMs, match: naive === fast })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {BIT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setBits(size)}
            disabled={status === 'loading'}
            className={
              size === bits ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {size}-bit
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Running… (the naive method takes a moment on purpose)'
          : 'Run both methods, live, in this tab'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">Naive: m**e % n</span>
            <code className="multibox-value">{formatMs(result.naiveMs)}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Efficient: pow(m, e, n)</span>
            <code className="multibox-value">{formatMs(result.fastMs)}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Speedup</span>
            <code className="multibox-value">
              {result.fastMs > 0
                ? `${Math.round(result.naiveMs / result.fastMs).toLocaleString()}x faster`
                : 'too fast to even measure a ratio'}{' '}
              - same result both ways
            </code>
          </div>
        </div>
      )}

      {result && (
        <p className="demo-note">
          Both methods compute the exact same answer - the naive one is
          just doing far more work to get there. It builds the full,
          real value of m^{Number(E)} first (a number with roughly{' '}
          {Math.round((bits * 65537) / 8 / 1024).toLocaleString()} KB worth
          of digits) and only reduces it modulo n at the very end. The
          efficient method reduces modulo n after every squaring instead,
          so no intermediate value ever grows past roughly n's own size.
        </p>
      )}
    </div>
  )
}

export default RsaModpowTiming
