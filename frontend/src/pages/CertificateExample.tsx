import { useState } from 'react'
import { generateCertificate, type CertificateResult } from '../lib/certificateDemo'

const FORMATS = ['PEM', 'PKCS7', 'DER', 'CER'] as const
type Format = (typeof FORMATS)[number]

function displayFor(result: CertificateResult, format: Format): string {
  switch (format) {
    case 'PEM':
      return result.certPem.trim()
    case 'PKCS7':
      return result.pkcs7Pem.trim()
    case 'DER':
    case 'CER':
      return result.derHex
  }
}

function CertificateExample() {
  const [format, setFormat] = useState<Format>('PEM')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [result, setResult] = useState<CertificateResult | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setResult(null)
    try {
      const generated = await generateCertificate('Alice', 'CryptoMaths Demo')
      setResult(generated)
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
        {status === 'loading' ? 'Generating…' : 'Generate a real certificate'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {result && (
        <>
          <p className="demo-note">
            A genuine, self-signed X.509 certificate, fresh RSA-2048 key
            pair and all, generated for real by this server's own{' '}
            <code>openssl</code>, just now. This is the file Alice would
            actually hand to Bob, the private key that produced it never
            leaves this server. Same certificate, four formats, pick one
            below.
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

export default CertificateExample
