import { useEffect, useState } from 'react'
import { keccak, sha3 } from 'hash-wasm'

function Sha3Explorer() {
  const [text, setText] = useState('Cipher')
  const [sha3_256, setSha3_256] = useState('')
  const [sha3_512, setSha3_512] = useState('')
  const [keccak256, setKeccak256] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([sha3(text, 256), sha3(text, 512), keccak(text, 256)]).then(
      ([s256, s512, k256]) => {
        if (cancelled) return
        setSha3_256(s256)
        setSha3_512(s512)
        setKeccak256(k256)
      },
    )
    return () => {
      cancelled = true
    }
  }, [text])

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
      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">SHA3-256</span>
          <code className="multibox-value">{sha3_256 || '-'}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">SHA3-512</span>
          <code className="multibox-value">{sha3_512 || '-'}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Keccak-256</span>
          <code className="multibox-value">{keccak256 || '-'}</code>
        </div>
      </div>
      <p className="demo-note">
        Keccak-256 isn't just SHA3-256 by another name - notice it produces
        a completely different hash for the same input. NIST changed the
        padding slightly when standardising Keccak into SHA-3, so the two
        diverge even though they share the same underlying construction.
      </p>
    </div>
  )
}

export default Sha3Explorer
