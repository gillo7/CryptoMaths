import { useState } from 'react'
import { opensslEncrypt, randomHex, textToHex } from '../lib/opensslDemo'

function BlowfishKeyExample() {
  const [key] = useState(() => randomHex(16))
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
      cipher: 'bf-cbc',
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
          <span className="multibox-label">Blowfish key</span>
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
        Fixed at 128 bits here - OpenSSL's <code>enc</code> CLI doesn't
        expose Blowfish's full 32-448 bit range.
      </p>
    </div>
  )
}

export default BlowfishKeyExample
