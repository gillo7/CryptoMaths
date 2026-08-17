import { useEffect, useState } from 'react'
import { ntlmHash } from '../lib/hashDemo'

function NtlmExplorer() {
  const [text, setText] = useState('Cipher')
  const [hash, setHash] = useState('')

  useEffect(() => {
    let cancelled = false
    ntlmHash(text).then((result) => {
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
        NTLM <code>{hash || '-'}</code>
      </p>
    </div>
  )
}

export default NtlmExplorer
