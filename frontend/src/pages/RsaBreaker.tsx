import { useEffect, useRef, useState } from 'react'
import {
  breakRsaKey,
  generateWeakRsaKey,
  type BrokenRsaKey,
  type WeakPublicKey,
} from '../lib/rsaDemo'

type Phase = 'idle' | 'ready' | 'breaking' | 'broken'

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

function RsaBreaker() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [publicKey, setPublicKey] = useState<WeakPublicKey | null>(null)
  const [broken, setBroken] = useState<BrokenRsaKey | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function handleReset() {
    setPhase('idle')
    setPublicKey(null)
    setBroken(null)
    setElapsedMs(0)
  }

  async function handleGenerate() {
    setStatus('loading')
    try {
      const key = await generateWeakRsaKey()
      setPublicKey(key)
      setPhase('ready')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  async function handleBreak() {
    if (!publicKey) return
    setPhase('breaking')
    setElapsedMs(0)
    const start = performance.now()
    timerRef.current = setInterval(() => {
      setElapsedMs(performance.now() - start)
    }, 100)
    try {
      const result = await breakRsaKey(publicKey.n, publicKey.e)
      setBroken(result)
      setPhase('broken')
    } catch {
      setStatus('error')
      setPhase('ready')
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      {phase === 'idle' && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'loading'}
          className="compute-button"
        >
          {status === 'loading' ? 'Generating…' : 'Generate a weak public key'}
        </button>
      )}

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {publicKey && (
        <>
          <p className="demo-note">
            A real {publicKey.bits}-bit key - this is all an attacker would
            actually have, the public key alone:
          </p>
          <div className="code-block">
            <code>{publicKey.publicPem.trim()}</code>
          </div>
        </>
      )}

      {phase === 'ready' && (
        <button type="button" onClick={handleBreak} className="compute-button">
          Break it
        </button>
      )}

      {phase === 'breaking' && (
        <button type="button" disabled className="compute-button">
          Factoring… {formatSeconds(elapsedMs)} elapsed
        </button>
      )}

      {broken && (
        <>
          <p className="demo-note">
            Cracked in {formatSeconds(broken.factorMs)}, using nothing but
            the public key above:
          </p>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">p</span>
              <code className="multibox-value">{broken.p}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">q</span>
              <code className="multibox-value">{broken.q}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">d</span>
              <code className="multibox-value">{broken.d}</code>
            </div>
          </div>
          <p className="demo-note">The full recovered private key:</p>
          <div className="code-block">
            <code>{broken.privatePem.trim()}</code>
          </div>
        </>
      )}

      {phase !== 'idle' && (
        <button
          type="button"
          onClick={handleReset}
          disabled={phase === 'breaking'}
          className="cost-button"
        >
          Start over
        </button>
      )}
    </div>
  )
}

export default RsaBreaker
