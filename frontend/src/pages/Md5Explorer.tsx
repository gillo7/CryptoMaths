import { useEffect, useState } from 'react'
import { md5 } from 'hash-wasm'

function Md5Explorer() {
  const [text, setText] = useState('Cipher')
  const [hash, setHash] = useState('')

  useEffect(() => {
    let cancelled = false
    md5(text).then((result) => {
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
        MD5 <code>{hash || '-'}</code>
      </p>
    </div>
  )
}

export default Md5Explorer
