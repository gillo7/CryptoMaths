import { useState } from 'react'
import { fetchLiveCertificate, type LiveCertificateResult } from '../lib/certificateDemo'

const HOSTS = ['cryptomaths.org', 'wikiclass.org'] as const

const FORMATS = ['Decoded', 'PEM', 'PKCS7', 'DER', 'CER'] as const
type Format = (typeof FORMATS)[number]

function displayFor(result: LiveCertificateResult, format: Format): string {
  switch (format) {
    case 'Decoded':
      return result.decodedText.trim()
    case 'PEM':
      return result.certPem.trim()
    case 'PKCS7':
      return result.pkcs7Pem.trim()
    case 'DER':
    case 'CER':
      return result.derHex
  }
}

function CertificateDecoder() {
  const [host, setHost] = useState<(typeof HOSTS)[number]>('cryptomaths.org')
  const [format, setFormat] = useState<Format>('Decoded')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<LiveCertificateResult | null>(null)

  async function handleFetch() {
    setStatus('loading')
    setResult(null)
    try {
      const fetched = await fetchLiveCertificate(host)
      setResult(fetched)
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

      {result && (
        <>
          <p className="demo-note">
            A real TLS handshake against the live site, just now, decoded
            with this server's own <code>openssl</code>. This is exactly
            what your browser checks every time you visit an HTTPS site,
            subject, issuer, validity, public key, signature algorithm,
            all of it.
          </p>

          <div className="cost-selector">
            {FORMATS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={
                  option === format
                    ? 'cost-button cost-button-active'
                    : 'cost-button'
                }
              >
                {option}
              </button>
            ))}
          </div>

          {format === 'CER' && (
            <p className="demo-note">
              .cer is just a common file extension for this same DER
              encoding, not a different one, the bytes below are
              identical to DER.
            </p>
          )}

          <div className="code-block">
            <code>{displayFor(result, format)}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default CertificateDecoder
