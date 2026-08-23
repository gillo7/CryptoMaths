import { useState } from 'react'
import { fetchRootCertificates, type RootCertificatesResult } from '../lib/certificateDemo'

function RootCertificates() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<RootCertificatesResult | null>(null)

  async function handleFetch() {
    setStatus('loading')
    setResult(null)
    try {
      const fetched = await fetchRootCertificates()
      setResult(fetched)
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
        onClick={handleFetch}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Reading…'
          : 'Show what this server actually trusts'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <p className="demo-note">
            Read straight off this server's own disk, at{' '}
            <code>/etc/ssl/certs/</code>, this is the real, current bundle
            of root and intermediate CA certificates it trusts by
            default, the exact same check your own machine runs, just
            usually hidden behind a certificate manager UI rather than
            listed out like this. Right now, that's{' '}
            <strong>{result.count}</strong> certificates.
          </p>
          <div className="code-block code-block-scroll">
            <code>
              {result.certs.map((cert) => cert.subject).join('\n')}
            </code>
          </div>
        </>
      )}
    </div>
  )
}

export default RootCertificates
