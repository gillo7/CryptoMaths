import { useState } from 'react'
import { generateKemKeypair, type KemKeypair } from '../lib/pqcDemo'

const VARIANTS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'] as const

function MlKemExample() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('ML-KEM-768')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [keypair, setKeypair] = useState<KemKeypair | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setKeypair(null)
    try {
      const result = await generateKemKeypair(variant)
      setKeypair({
        ...result,
        publicPem: result.publicPem.trim(),
        privatePem: result.privatePem.trim(),
      })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

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
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Generating…' : 'Generate a real ML-KEM keypair'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {keypair && (
        <>
          <p className="demo-note">
            A genuine {keypair.variant} keypair, generated for real by
            this server's own OpenSSL, just now.
          </p>
          <p className="demo-note">
            <strong>Public key</strong> - this is the one Bob shares
            freely:
          </p>
          <div className="code-block">
            <code>{keypair.publicPem}</code>
          </div>
          <p className="demo-note">
            <strong>Private key</strong> - this one never leaves his
            hands:
          </p>
          <div className="code-block">
            <code>{keypair.privatePem}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default MlKemExample
