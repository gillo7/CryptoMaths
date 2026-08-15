import { useState } from 'react'
import { md5 } from 'hash-wasm'

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

interface CollisionResult {
  msg1: string
  msg2: string
  hash1: string
  hash2: string
}

function Md5CollisionDemo() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<CollisionResult | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setResult(null)
    try {
      const response = await fetch('/api/hashing/md5-collision', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('request failed')
      const { msg1, msg2 } = await response.json()
      const [hash1, hash2] = await Promise.all([
        md5(hexToBytes(msg1)),
        md5(hexToBytes(msg2)),
      ])
      setResult({ msg1, msg2, hash1, hash2 })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Generating… (a few seconds)'
          : 'Generate a real MD5 collision'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">Message 1</span>
            <code className="multibox-value">{result.msg1}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Message 2</span>
            <code className="multibox-value">{result.msg2}</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">MD5 of both</span>
            <code className="multibox-value">
              {result.hash1}
              {result.hash1 === result.hash2 ? ' - identical!' : ' - MISMATCH'}
            </code>
          </div>
        </div>
      )}

      <p className="collision-credit">
        Collision generated live on this server using <code>fastcoll</code>,
        an algorithm by{' '}
        <a
          href="https://github.com/cr-marcstevens/hashclash"
          target="_blank"
          rel="noopener noreferrer"
        >
          Marc Stevens
        </a>
        .
      </p>
    </div>
  )
}

export default Md5CollisionDemo
