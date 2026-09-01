import { useState } from 'react'
import { hqcEncapAndDecap, type HqcEncapDecapResult } from '../lib/pqcDemo'

const VARIANTS = ['HQC-128', 'HQC-192', 'HQC-256'] as const

function wrapHex(hex: string, width = 64): string {
  const lines = []
  for (let i = 0; i < hex.length; i += width) lines.push(hex.slice(i, i + width))
  return lines.join('\n')
}

function HqcEncapDecap() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('HQC-128')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<HqcEncapDecapResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const data = await hqcEncapAndDecap(variant)
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
        The same encapsulate/decapsulate exchange as ML-KEM's, just
        built on error-correcting codes instead of lattices: Bob
        encapsulates against Alice's public key, Alice decapsulates the
        resulting ciphertext with her private key, and both sides
        should arrive at the identical secret without ever
        transmitting it directly.
      </p>

      <div className="cost-selector">
        {VARIANTS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setVariant(option)}
            disabled={status === 'loading'}
            className={
              option === variant ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Running…' : 'Encapsulate and decapsulate for real'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">Ciphertext size</span>
              <code className="multibox-value">{result.ciphertextBytes} bytes</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Bob's shared secret</span>
              <code className="multibox-value">{result.bobSecretHex}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Alice's shared secret</span>
              <code className="multibox-value">{result.aliceSecretHex}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Match</span>
              <code className="multibox-value">
                {result.matched ? 'Yes, genuinely identical' : 'Mismatch'}
              </code>
            </div>
          </div>
          <p className="demo-note">The ciphertext Bob actually sends:</p>
          <div className="code-block code-block-scroll">
            <code>{wrapHex(result.ciphertextHex)}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default HqcEncapDecap
