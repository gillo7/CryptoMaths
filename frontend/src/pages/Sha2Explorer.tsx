import { useEffect, useState } from 'react'
import { sha224, sha256, sha384, sha512 } from 'hash-wasm'

const VARIANTS = [
  { label: 'SHA-224', fn: sha224 },
  { label: 'SHA-256', fn: sha256 },
  { label: 'SHA-384', fn: sha384 },
  { label: 'SHA-512', fn: sha512 },
]

function Sha2Explorer() {
  const [text, setText] = useState('')
  const [hashes, setHashes] = useState<string[]>(['', '', '', ''])

  useEffect(() => {
    let cancelled = false
    Promise.all(VARIANTS.map((variant) => variant.fn(text))).then((results) => {
      if (!cancelled) setHashes(results)
    })
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
        {VARIANTS.map((variant, i) => (
          <div className="multibox-row" key={variant.label}>
            <span className="multibox-label">{variant.label}</span>
            <code className="multibox-value">{hashes[i] || '-'}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sha2Explorer
