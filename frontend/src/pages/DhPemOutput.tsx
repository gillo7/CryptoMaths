import { useState } from 'react'
import { generateDhKey } from '../lib/dhKeyDemo'

const GROUPS = ['ffdhe2048', 'ffdhe3072', 'ffdhe4096'] as const

interface PemPair {
  privatePem: string
  publicPem: string
}

function DhPemOutput() {
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('ffdhe2048')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pems, setPems] = useState<PemPair | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setPems(null)
    try {
      const key = await generateDhKey(group)
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
        {GROUPS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGroup(option)}
            disabled={status === 'loading'}
            className={
              option === group ? 'cost-button cost-button-active' : 'cost-button'
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

export default DhPemOutput
