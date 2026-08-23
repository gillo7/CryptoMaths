import { useState } from 'react'
import { checkCrlRevocation, type CrlCheckResult } from '../lib/certificateDemo'

const HOSTS = ['cryptomaths.org', 'wikiclass.org', 'revoked.badssl.com'] as const

function CrlCheck() {
  const [host, setHost] = useState<(typeof HOSTS)[number]>('cryptomaths.org')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<CrlCheckResult | null>(null)

  async function handleCheck() {
    setStatus('loading')
    setResult(null)
    try {
      const checked = await checkCrlRevocation(host)
      setResult(checked)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {HOSTS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setHost(option)}
            disabled={status === 'loading'}
            className={
              option === host ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCheck}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Checking…' : `Check ${host} against the real CRL`}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <p className="demo-note">
            {host}'s live certificate, fetched just now, its CRL
            Distribution Point followed to the CA's actual published CRL
            ({result.totalRevoked} revoked serial numbers on it right
            now), and its own serial number searched for in that real
            list.
          </p>
          <div className="multibox">
            <div className="multibox-row">
              <span className="multibox-label">Result</span>
              <code className="multibox-value">
                {result.revoked
                  ? `REVOKED, on ${result.revokedDate}`
                  : 'Not revoked'}
              </code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">Serial number</span>
              <code className="multibox-value">{result.serial}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">CRL source</span>
              <code className="multibox-value">{result.crlUrl}</code>
            </div>
            <div className="multibox-row">
              <span className="multibox-label">CRL last updated</span>
              <code className="multibox-value">{result.lastUpdate}</code>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CrlCheck
