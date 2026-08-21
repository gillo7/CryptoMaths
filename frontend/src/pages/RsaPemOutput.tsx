import { useState } from 'react'
import { generateRsaKey } from '../lib/rsaDemo'

const BIT_SIZES = [512, 1024, 2048] as const

interface PemPair {
  privatePem: string
  publicPem: string
}

function RsaPemOutput() {
  const [bits, setBits] = useState<(typeof BIT_SIZES)[number]>(2048)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pems, setPems] = useState<PemPair | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setPems(null)
    try {
      const key = await generateRsaKey(bits)
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

export default RsaPemOutput
