import { useState } from 'react'
import { bytesToHex, hexToBytes, randomHex } from '../lib/hexUtils'
import { salsa20Xor } from '../lib/salsa20Demo'

function Salsa20KeyExample() {
  const [key] = useState(() => randomHex(32))
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ nonce: string; ciphertext: string } | null>(
    null,
  )

  function handleEncrypt() {
    if (!text) return
    const nonceBytes = crypto.getRandomValues(new Uint8Array(8))
    const ciphertext = salsa20Xor(
      hexToBytes(key),
      nonceBytes,
      new TextEncoder().encode(text),
    )
    setResult({ nonce: bytesToHex(nonceBytes), ciphertext: bytesToHex(ciphertext) })
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Salsa20 key</span>
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
        disabled={!text}
        className="compute-button"
      >
        Encrypt with this key
      </button>

      {result && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">Nonce</span>
            <code className="multibox-value">{result.nonce}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Ciphertext</span>
            <code className="multibox-value">{result.ciphertext}</code>
          </div>
        </div>
      )}

      <p className="demo-note">
        OpenSSL has never implemented Salsa20, so this runs entirely in
        your browser via a small verified JS implementation - no server
        involved at all. The 32-byte key matches the "expand 32-byte k"
        constant from the section above.
      </p>
    </div>
  )
}

export default Salsa20KeyExample
