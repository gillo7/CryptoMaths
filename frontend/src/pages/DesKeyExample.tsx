import { useState } from 'react'
import { opensslEncrypt, randomHex, textToHex } from '../lib/opensslDemo'

function DesKeyExample() {
  const [key] = useState(() => randomHex(8))
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<{ iv: string; ciphertext: string } | null>(
    null,
  )

  async function handleEncrypt() {
    if (!text) return
    setStatus('loading')
    const iv = randomHex(8)
    const response = await opensslEncrypt({
      cipher: 'des-cbc',
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

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">DES key</span>
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

      <p className="demo-note">
        This is real DES-CBC encryption via OpenSSL on the server - a
        fresh random IV is generated each time you encrypt, which is why
        encrypting the same text twice gives a different result.
      </p>
    </div>
  )
}

export default DesKeyExample
