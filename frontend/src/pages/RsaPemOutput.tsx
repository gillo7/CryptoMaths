import { useState } from 'react'
import { generateRsaKey } from '../lib/rsaDemo'

const BIT_SIZES = [512, 1024, 2048] as const

function RsaPemOutput() {
  const [bits, setBits] = useState<(typeof BIT_SIZES)[number]>(2048)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pem, setPem] = useState('')

  async function handleGenerate() {
    setStatus('loading')
    setPem('')
    try {
      const key = await generateRsaKey(bits)
      setPem(key.pem.trim())
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

      {pem && (
        <div className="code-block">
          <code>{pem}</code>
        </div>
      )}

      {pem && (
        <p className="demo-note">
          That's the same p, q, N, e, and d from above, real OpenSSL
          output this time - just Base64-encoded and wrapped in
          BEGIN/END markers rather than broken out field by field.
        </p>
      )}
    </div>
  )
}

export default RsaPemOutput
