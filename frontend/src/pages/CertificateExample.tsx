import { useState } from 'react'
import { generateCertificate } from '../lib/certificateDemo'

function CertificateExample() {
  const [commonName, setCommonName] = useState('Alice')
  const [organisation, setOrganisation] = useState('CryptoMaths Demo')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [certPem, setCertPem] = useState<string | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setCertPem(null)
    try {
      const result = await generateCertificate(commonName, organisation)
      setCertPem(result.certPem.trim())
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
        value={commonName}
        onChange={(event) => setCommonName(event.target.value)}
        placeholder="Common Name (CN)…"
        className="explorer-input"
      />
      <input
        type="text"
        value={organisation}
        onChange={(event) => setOrganisation(event.target.value)}
        placeholder="Organisation (O)…"
        className="explorer-input"
      />

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

      {certPem && (
        <>
          <p className="demo-note">
            A genuine, self-signed X.509 certificate, fresh RSA-2048 key
            pair and all, generated for real by this server's own{' '}
            <code>openssl</code>, just now. This is the file Alice would
            actually hand to Bob, the private key that produced it never
            leaves this server.
          </p>
          <div className="code-block">
            <code>{certPem}</code>
          </div>
        </>
      )}
    </div>
  )
}

export default CertificateExample
