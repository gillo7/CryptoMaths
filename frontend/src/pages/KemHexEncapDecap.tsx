import { useState } from 'react'

export interface KemHexEncapDecapResult {
  variant: string
  publicKeyHex: string
  publicKeyBytes: number
  ciphertextHex: string
  ciphertextBytes: number
  bobSecretHex: string
  aliceSecretHex: string
  matched: boolean
}

function wrapHex(hex: string, width = 64): string {
  const lines = []
  for (let i = 0; i < hex.length; i += width) lines.push(hex.slice(i, i + width))
  return lines.join('\n')
}

interface KemHexEncapDecapProps {
  variants: readonly string[]
  defaultVariant: string
  encapAndDecap: (variant: string) => Promise<KemHexEncapDecapResult>
  description: string
  buttonLabel: string
}

function KemHexEncapDecap({
  variants,
  defaultVariant,
  encapAndDecap,
  description,
  buttonLabel,
}: KemHexEncapDecapProps) {
  const [variant, setVariant] = useState(defaultVariant)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<KemHexEncapDecapResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const data = await encapAndDecap(variant)
      setResult(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>{description}</p>

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

export default KemHexEncapDecap
