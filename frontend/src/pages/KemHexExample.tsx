import { useState } from 'react'

export interface KemHexKeypair {
  variant: string
  publicKeyHex: string
  privateKeyHex: string
  publicKeyBytes: number
  privateKeyBytes: number
}

function wrapHex(hex: string, width = 64): string {
  const lines = []
  for (let i = 0; i < hex.length; i += width) lines.push(hex.slice(i, i + width))
  return lines.join('\n')
}

interface KemHexExampleProps {
  variants: readonly string[]
  defaultVariant: string
  generateKeypair: (variant: string) => Promise<KemHexKeypair>
  buttonLabel: string
  note: string
}

function KemHexExample({
  variants,
  defaultVariant,
  generateKeypair,
  buttonLabel,
  note,
}: KemHexExampleProps) {
  const [variant, setVariant] = useState(defaultVariant)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [keypair, setKeypair] = useState<KemHexKeypair | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setKeypair(null)
    try {
      const result = await generateKeypair(variant)
      setKeypair(result)
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

      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Generating…' : buttonLabel}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {keypair && (
        <>
          <p className="demo-note">
            A genuine {keypair.variant} keypair, generated for real by
            this server via liboqs directly, {note} Public key:{' '}
            {keypair.publicKeyBytes} bytes, private key:{' '}
            {keypair.privateKeyBytes} bytes.
          </p>
          <p className="demo-note">
            <strong>Public key</strong> - this is the one Bob shares
            freely:
          </p>
          <div className="code-block code-block-scroll">
            <code>{wrapHex(keypair.publicKeyHex)}</code>
          </div>
          <p className="demo-note">
            <strong>Private key</strong> - this one never leaves his
            hands:
          </p>
          <div className="code-block code-block-scroll">
            <code>{wrapHex(keypair.privateKeyHex)}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default KemHexExample
