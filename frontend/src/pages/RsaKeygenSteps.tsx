import { useState } from 'react'
import { generateRsaKey, type RsaKey } from '../lib/rsaDemo'

const BIT_SIZES = [512, 1024, 2048] as const
const STEP_DELAY_MS = 700

const STEPS = [
  { label: 'p', value: (k: RsaKey) => k.p },
  { label: 'q', value: (k: RsaKey) => k.q },
  { label: 'N = p × q', value: (k: RsaKey) => k.n },
  { label: 'e', value: (k: RsaKey) => k.e },
  { label: 'd', value: (k: RsaKey) => k.d },
  { label: 'Public key (e, N)', value: (k: RsaKey) => `${k.e}, ${k.n}` },
  { label: 'Private key (d, N)', value: (k: RsaKey) => `${k.d}, ${k.n}` },
]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function RsaKeygenSteps() {
  const [bits, setBits] = useState<(typeof BIT_SIZES)[number]>(512)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [key, setKey] = useState<RsaKey | null>(null)
  const [revealedSteps, setRevealedSteps] = useState(0)

  async function handleGenerate() {
    setStatus('loading')
    setKey(null)
    setRevealedSteps(0)
    try {
      const result = await generateRsaKey(bits)
      setKey(result)
      setStatus('idle')
      for (let i = 1; i <= STEPS.length; i++) {
        await sleep(STEP_DELAY_MS)
        setRevealedSteps(i)
      }
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
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Generating…' : 'Generate a real RSA key, live'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {key && (
        <div className="multibox">
          {STEPS.slice(0, revealedSteps).map((step) => (
            <div className="multibox-row" key={step.label}>
              <span className="multibox-label">{step.label}</span>
              <code className="multibox-value">{step.value(key)}</code>
            </div>
          ))}
        </div>
      )}

      {key && (
        <p className="demo-note">
          A genuine {key.bits}-bit key from real OpenSSL, generated fresh
          just now, not a canned example - p and q are real random primes,
          and N, e, and d are computed from them exactly as described
          above. e is 65537 here too, the practical default covered next.
        </p>
      )}
    </div>
  )
}

export default RsaKeygenSteps
