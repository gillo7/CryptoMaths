import { useState } from 'react'
import { opensslEncrypt, randomHex, textToHex } from '../lib/opensslDemo'

function Rc4KeyExample() {
  const [key] = useState(() => randomHex(16))
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [ciphertext, setCiphertext] = useState('')

  async function handleEncrypt() {
    if (!text) return
    setStatus('loading')
    const response = await opensslEncrypt({
      cipher: 'rc4',
      keyHex: key,
      dataHex: textToHex(text),
    })
    if (response.ok && response.dataHex) {
      setCiphertext(response.dataHex)
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
          <span className="multibox-label">RC4 key</span>
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

      {ciphertext && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">Ciphertext</span>
            <code className="multibox-value">{ciphertext}</code>
          </div>
        </div>
      )}

      <p className="demo-note">
        No IV here - unlike every block cipher so far, RC4 is a pure key
        stream, so encrypting the same text twice with the same key always
        gives the same result.
      </p>
    </div>
  )
}

export default Rc4KeyExample
