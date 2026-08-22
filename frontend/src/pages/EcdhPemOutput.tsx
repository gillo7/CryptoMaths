import { useState } from 'react'
import { generateEcdhKey } from '../lib/ecdhKeyDemo'

// Curve25519 and secp256k1 aren't offered here - both get their own
// introduction with real context (Curve25519's transparent-design story,
// secp256k1's cryptocurrency association) on the Curves in Practice page
// that follows this one, so naming them here first would be premature.
const CURVES = ['P-256', 'P-384', 'P-521'] as const

interface PemPair {
  privatePem: string
  publicPem: string
}

function EcdhPemOutput() {
  const [curve, setCurve] = useState<(typeof CURVES)[number]>('P-256')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pems, setPems] = useState<PemPair | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setPems(null)
    try {
      const key = await generateEcdhKey(curve)
      setPems({
        privatePem: key.privatePem.trim(),
        publicPem: key.publicPem.trim(),
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
        {CURVES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCurve(option)}
            disabled={status === 'loading'}
            className={
              option === curve ? 'cost-button cost-button-active' : 'cost-button'
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
        {status === 'loading' ? 'Generating…' : 'Generate a real .pem key'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {pems && (
        <>
          <p className="demo-note">
            <strong>Public key</strong> - this is the one Bob shares
            freely:
          </p>
          <div className="code-block">
            <code>{pems.publicPem}</code>
          </div>
          <p className="demo-note">
            <strong>Private key</strong> - this one never leaves his
            hands:
          </p>
          <div className="code-block">
            <code>{pems.privatePem}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default EcdhPemOutput
