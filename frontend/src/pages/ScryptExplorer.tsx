import { useState } from 'react'
import { scrypt } from 'hash-wasm'

const COST_OPTIONS = [1024, 4096, 16384, 65536]

function ScryptExplorer() {
  const [text, setText] = useState('Cipher')
  const [costFactor, setCostFactor] = useState(16384)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [hash, setHash] = useState('')

  async function handleHash() {
    if (!text) return
    setStatus('loading')
    const result = await scrypt({
      password: text,
      salt: crypto.getRandomValues(new Uint8Array(16)),
      costFactor,
      blockSize: 8,
      parallelism: 1,
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
        {COST_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCostFactor(option)}
            className={
              option === costFactor
                ? 'cost-button cost-button-active'
                : 'cost-button'
            }
          >
            N = {option.toLocaleString()}
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
          Scrypt (N={costFactor.toLocaleString()}) <code>{hash}</code>
        </p>
      )}
      {hash && (
        <p className="demo-note">
          N is the CPU/memory cost parameter - each doubling roughly doubles
          both the time taken and the memory required, which is exactly what
          makes scrypt expensive to parallelise on cracking hardware.
        </p>
      )}
    </div>
  )
}

export default ScryptExplorer
