export interface KemKeypair {
  variant: string
  publicPem: string
  privatePem: string
}

export async function generateKemKeypair(variant: string): Promise<KemKeypair> {
  const response = await fetch('/api/pqc/ml-kem/keygen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface SignResult {
  variant: string
  publicPem: string
  message: string
  signatureHex: string
  signatureBytes: number
  verified: boolean
}

async function signAndVerify(
  endpoint: 'ml-dsa' | 'slh-dsa',
  variant: string,
  message: string,
): Promise<SignResult> {
  const response = await fetch(`/api/pqc/${endpoint}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant, message }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export function signAndVerifyMlDsa(variant: string, message: string) {
  return signAndVerify('ml-dsa', variant, message)
}

export function signAndVerifySlhDsa(variant: string, message: string) {
  return signAndVerify('slh-dsa', variant, message)
}

export interface SpeedResult {
  label: string
  ms: number
}

async function fetchSpeed(endpoint: string): Promise<SpeedResult[]> {
  const response = await fetch(`/api/pqc/${endpoint}/speed`, { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data.results
}

export function fetchKemSpeed() {
  return fetchSpeed('ml-kem')
}

export function fetchMlDsaSpeed() {
  return fetchSpeed('ml-dsa')
}

export function fetchSlhDsaSpeed() {
  return fetchSpeed('slh-dsa')
}
