import { useState } from 'react'
import { runTlsScan, type TlsScanResult } from '../lib/tlsDemo'

function TlsScan() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<TlsScanResult | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResult(null)
    try {
      const data = await runTlsScan()
      setResult(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>
        This app uses TLS! So does your browser. Every check below is
        real: your own connection's details come straight from nginx's
        own record of the request you just made, and the server checks
        are genuine live handshake attempts against this very site,
        not a cached or precomputed result.
      </p>

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Running real handshakes…'
          : 'Check my connection and this server'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <p className="demo-note">
            <strong>Your connection</strong>, right now, to load this
            page:
          </p>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">Protocol</span>
              <code className="multibox-value">
                {result.yourConnection.protocol ?? 'unknown'}
              </code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Cipher suite</span>
              <code className="multibox-value">
                {result.yourConnection.cipher ?? 'unknown'}
              </code>
            </div>
          </div>

          <p className="demo-note">
            <strong>This server</strong>, tested live just now:
          </p>
          <div className="multibox">
            {result.serverChecks.map((check) => (
              <div className="multibox-row" key={check.id}>
                <span className="multibox-label">{check.label}</span>
                <code className="multibox-value">
                  {check.supported
                    ? `Accepted (${check.cipher})`
                    : 'Rejected'}
                </code>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default TlsScan
