export interface CertificateResult {
  certPem: string
  commonName: string
  organisation: string
}

export async function generateCertificate(
  commonName: string,
  organisation: string,
): Promise<CertificateResult> {
  const response = await fetch('/api/certificates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commonName, organisation }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface LiveCertificateResult {
  host: string
  certPem: string
  pkcs7Pem: string
  derHex: string
  decodedText: string
}

export async function fetchLiveCertificate(host: string): Promise<LiveCertificateResult> {
  const response = await fetch('/api/certificates/fetch-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface RootCertificate {
  subject: string
  issuer: string
  validTo: string
  fingerprint256: string
}

export interface RootCertificatesResult {
  count: number
  certs: RootCertificate[]
}

export async function fetchRootCertificates(): Promise<RootCertificatesResult> {
  const response = await fetch('/api/certificates/root-certs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
