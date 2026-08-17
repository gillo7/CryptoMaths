import { useState } from 'react'
import { argon2d, argon2i, argon2id } from 'hash-wasm'

const VARIANTS = {
  Argon2d: argon2d,
  Argon2i: argon2i,
  Argon2id: argon2id,
} as const

type VariantName = keyof typeof VARIANTS

const DEMO_PARAMS = { parallelism: 1, iterations: 3, memorySize: 4096 }

function Argon2Explorer() {
  const [text, setText] = useState('Cipher')
  const [variant, setVariant] = useState<VariantName>('Argon2id')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [hash, setHash] = useState('')

  async function handleHash() {
    if (!text) return
    setStatus('loading')
    const result = await VARIANTS[variant]({
      password: text,
      salt: crypto.getRandomValues(new Uint8Array(16)),
      ...DEMO_PARAMS,
      hashLength: 32,
      outputType: 'hex',
    })
    setHash(result)
    setStatus('idle')
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something…"
        className="explorer-input"
      />

      <div className="cost-selector">
        {(Object.keys(VARIANTS) as VariantName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setVariant(name)}
            className={
              name === variant ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleHash}
        disabled={status === 'loading' || !text}
        className="compute-button"
      >
        {status === 'loading' ? 'Hashing…' : 'Hash it'}
      </button>
      {hash && (
        <p className="hash-result">
          {variant} <code>{hash}</code>
        </p>
      )}
      {hash && (
        <p className="demo-note">
          Click again with the same text and variant - the salt is random
          each time, so you'll get a completely different string.
        </p>
      )}
    </div>
  )
}

export default Argon2Explorer
