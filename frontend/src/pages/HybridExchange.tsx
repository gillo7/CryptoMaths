import { useState } from 'react'
import { runHybridExchange, type HybridExchangeResult } from '../lib/pqcDemo'

function wrapHex(hex: string, width = 64): string {
  const lines = []
  for (let i = 0; i < hex.length; i += width) lines.push(hex.slice(i, i + width))
  return lines.join('\n')
}

function HybridExchange() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<HybridExchangeResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const data = await runHybridExchange()
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
        Both halves run for real and independently: Alice and Bob each
        complete a full X25519 ECDH derivation, then Alice publishes an
        ML-KEM-768 encapsulation key that Bob encapsulates against. The
        two resulting secrets are concatenated, exactly as a real TLS
        1.3 hybrid handshake combines them.
      </p>

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Running…' : 'Run a real hybrid exchange'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">X25519 secret</span>
              <code className="multibox-value">
                {result.x25519SecretBytes} bytes,{' '}
                {result.x25519Matched ? 'both sides match' : 'mismatch'}
              </code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">ML-KEM-768 ciphertext</span>
              <code className="multibox-value">{result.mlkemCiphertextBytes} bytes</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">ML-KEM-768 secret</span>
              <code className="multibox-value">
                {result.mlkemSecretBytes} bytes,{' '}
                {result.mlkemMatched ? 'both sides match' : 'mismatch'}
              </code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Combined secret</span>
              <code className="multibox-value">
                {result.combinedSecretBytes} bytes,{' '}
                {result.combinedMatched
                  ? 'genuinely identical on both sides'
                  : 'mismatch'}
              </code>
            </div>
          </div>
          <p className="demo-note">
            The combined secret actually fed into the TLS 1.3 key
            schedule, the X25519 half followed by the ML-KEM-768 half,
            simple concatenation:
          </p>
          <div className="code-block code-block-scroll">
            <code>{wrapHex(result.combinedSecretHex)}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default HybridExchange
