import { useState } from 'react'
import { lmHash } from '../lib/hashDemo'

function sanitizeInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
}

function LmCrackerDemo() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [cracked, setCracked] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  const hash = password ? lmHash(password) : ''

  async function handleCrack() {
    if (!password) return
    setStatus('loading')
    setCracked(null)
    setElapsedMs(null)
    try {
      const response = await fetch('/api/hashing/lm-crack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lmHash: hash }),
      })
      if (!response.ok) throw new Error('request failed')
      const data = await response.json()
      setCracked(data.cracked ? data.password : '')
      setElapsedMs(data.elapsedMs ?? null)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={password}
        onChange={(event) => setPassword(sanitizeInput(event.target.value))}
        placeholder="Type a short password (letters/digits, max 5)…"
        className="explorer-input"
        maxLength={5}
      />

      {password && (
        <p className="hash-result">
          LM hash sent to the server (not the password itself):{' '}
          <code>{hash}</code>
        </p>
      )}

      <button
        type="button"
        onClick={handleCrack}
        disabled={status === 'loading' || !password}
        className="compute-button"
      >
        {status === 'loading' ? 'Cracking… (a few seconds)' : 'Crack it'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {cracked !== null && (
        <p className="hash-result">
          {cracked
            ? `Server recovered: "${cracked}"${cracked === password ? ' - matches!' : ''}`
            : "Not cracked within this demo's limits."}
          {elapsedMs !== null &&
            ` (John the Ripper took ${(elapsedMs / 1000).toFixed(2)}s on the server)`}
        </p>
      )}
    </div>
  )
}

export default LmCrackerDemo
