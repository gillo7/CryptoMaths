import { useEffect, useState } from 'react'
import { sha1 } from 'hash-wasm'

function Sha1Explorer() {
  const [text, setText] = useState('Cipher')
  const [hash, setHash] = useState('')

  useEffect(() => {
    let cancelled = false
    sha1(text).then((result) => {
      if (!cancelled) setHash(result)
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
      <p className="hash-result">
        SHA-1 <code>{hash || '-'}</code>
      </p>
    </div>
  )
}

export default Sha1Explorer
