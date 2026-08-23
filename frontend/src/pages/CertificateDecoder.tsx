import { useState } from 'react'
import { fetchLiveCertificate } from '../lib/certificateDemo'

const HOSTS = ['cryptomaths.org', 'wikiclass.org'] as const

function CertificateDecoder() {
  const [host, setHost] = useState<(typeof HOSTS)[number]>('cryptomaths.org')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [decodedText, setDecodedText] = useState<string | null>(null)

  async function handleFetch() {
    setStatus('loading')
    setDecodedText(null)
    try {
      const result = await fetchLiveCertificate(host)
      setDecodedText(result.decodedText.trim())
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
        onClick={handleFetch}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading'
          ? 'Connecting…'
          : `Fetch ${host}'s real certificate`}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {decodedText && (
        <>
          <p className="demo-note">
            A real TLS handshake against the live site, just now, decoded
            with this server's own <code>openssl</code>. This is exactly
            what your browser checks every time you visit an HTTPS site,
            subject, issuer, validity, public key, signature algorithm,
            all of it.
          </p>
          <div className="code-block">
            <code>{decodedText}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default CertificateDecoder
