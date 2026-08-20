import { useState } from 'react'
import { bytesToHex, hexToBytes, randomHex } from '../lib/hexUtils'
import { twofishEncryptCbc } from '../lib/twofishDemo'

function TwofishKeyExample() {
  const [key] = useState(() => randomHex(16))
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ iv: string; ciphertext: string } | null>(
    null,
  )

  function handleEncrypt() {
    if (!text) return
    const ivBytes = crypto.getRandomValues(new Uint8Array(16))
    const ciphertext = twofishEncryptCbc(
      hexToBytes(key),
      ivBytes,
      new TextEncoder().encode(text),
    )
    setResult({ iv: bytesToHex(ivBytes), ciphertext: bytesToHex(ciphertext) })
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Twofish key</span>
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
        OpenSSL has never implemented Twofish, so this runs entirely in
        your browser via a small verified JS implementation instead - no
        server involved at all.
      </p>
    </div>
  )
}

export default TwofishKeyExample
