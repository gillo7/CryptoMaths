import { useState } from 'react'
import type { SignResult } from '../lib/pqcDemo'

function wrapHex(hex: string, width = 64): string {
  const lines = []
  for (let i = 0; i < hex.length; i += width) lines.push(hex.slice(i, i + width))
  return lines.join('\n')
}

interface PqcSignExampleProps {
  variants: readonly string[]
  defaultVariant: string
  signAndVerify: (variant: string, message: string) => Promise<SignResult>
}

function PqcSignExample({ variants, defaultVariant, signAndVerify }: PqcSignExampleProps) {
  const [variant, setVariant] = useState(defaultVariant)
  const [message, setMessage] = useState('Hello, post-quantum world!')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<SignResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const signed = await signAndVerify(variant, message)
      setResult(signed)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {variants.map((option) => (
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

      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type a message to sign…"
        className="explorer-input"
      />

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Signing…' : `Sign and verify with ${variant}`}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">Signature size</span>
              <code className="multibox-value">{result.signatureBytes} bytes</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Verified</span>
              <code className="multibox-value">
                {result.verified ? 'Yes, genuinely verified' : 'Failed'}
              </code>
            </div>
          </div>
          <p className="demo-note">
            The full signature, generated and verified for real by this
            server's own OpenSSL, just now:
          </p>
          <div className="code-block code-block-scroll">
            <code>{wrapHex(result.signatureHex)}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default PqcSignExample
