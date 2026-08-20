import { useState } from 'react'
import { opensslEncrypt, randomHex, textToHex } from '../lib/opensslDemo'

const KEY_SIZES = {
  'AES-128': { cipher: 'aes-128-cbc', keyBytes: 16, rounds: 10 },
  'AES-192': { cipher: 'aes-192-cbc', keyBytes: 24, rounds: 12 },
  'AES-256': { cipher: 'aes-256-cbc', keyBytes: 32, rounds: 14 },
} as const

type SizeName = keyof typeof KEY_SIZES

function AesKeyExample() {
  const [size, setSize] = useState<SizeName>('AES-128')
  const [key, setKey] = useState(() => randomHex(KEY_SIZES['AES-128'].keyBytes))
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<{ iv: string; ciphertext: string } | null>(
    null,
  )

  function handleSizeChange(name: SizeName) {
    setSize(name)
    setKey(randomHex(KEY_SIZES[name].keyBytes))
    setResult(null)
  }

  async function handleEncrypt() {
    if (!text) return
    setStatus('loading')
    const iv = randomHex(16)
    const response = await opensslEncrypt({
      cipher: KEY_SIZES[size].cipher,
      keyHex: key,
      ivHex: iv,
      dataHex: textToHex(text),
    })
    if (response.ok && response.dataHex) {
      setResult({ iv, ciphertext: response.dataHex })
      setStatus('idle')
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {(Object.keys(KEY_SIZES) as SizeName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleSizeChange(name)}
            className={
              name === size ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {name} ({KEY_SIZES[name].rounds} rounds)
          </button>
        ))}
      </div>

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Key</span>
          <code className="multibox-value">{key}</code>
        </div>
      </div>

      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something to encrypt…"
        className="explorer-input"
      />

      <button
        type="button"
        onClick={handleEncrypt}
        disabled={status === 'loading' || !text}
        className="compute-button"
      >
        {status === 'loading' ? 'Encrypting…' : 'Encrypt with this key'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">IV</span>
            <code className="multibox-value">{result.iv}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Ciphertext</span>
            <code className="multibox-value">{result.ciphertext}</code>
          </div>
        </div>
      )}
    </div>
  )
}

export default AesKeyExample
