import { useState } from 'react'
import { bcrypt } from 'hash-wasm'

const COST_OPTIONS = [8, 10, 12, 14]

function BcryptExplorer() {
  const [text, setText] = useState('Cipher')
  const [cost, setCost] = useState(10)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [hash, setHash] = useState('')

  async function handleHash() {
    if (!text) return
    setStatus('loading')
    const result = await bcrypt({
      password: text,
      salt: crypto.getRandomValues(new Uint8Array(16)),
      costFactor: cost,
      outputType: 'encoded',
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
        {COST_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCost(option)}
            className={
              option === cost ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            Cost {option}
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
          Bcrypt (cost {cost}) <code>{hash}</code>
        </p>
      )}
      {hash && (
        <p className="demo-note">
          Click again with the same text - the salt is random each time, so
          you'll get a completely different string.
        </p>
      )}
    </div>
  )
}

export default BcryptExplorer
