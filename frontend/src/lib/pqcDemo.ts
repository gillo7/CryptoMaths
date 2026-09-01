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

export interface EncapDecapResult {
  variant: string
  publicPem: string
  ciphertextHex: string
  ciphertextBytes: number
  bobSecretHex: string
  aliceSecretHex: string
  matched: boolean
}

export async function encapAndDecap(variant: string): Promise<EncapDecapResult> {
  const response = await fetch('/api/pqc/ml-kem/encap-decap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface HqcKeypair {
  variant: string
  publicKeyHex: string
  privateKeyHex: string
  publicKeyBytes: number
  privateKeyBytes: number
}

export async function generateHqcKeypair(variant: string): Promise<HqcKeypair> {
  const response = await fetch('/api/pqc/hqc/keygen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface HqcEncapDecapResult {
  variant: string
  publicKeyHex: string
  publicKeyBytes: number
  ciphertextHex: string
  ciphertextBytes: number
  bobSecretHex: string
  aliceSecretHex: string
  matched: boolean
}

export async function hqcEncapAndDecap(variant: string): Promise<HqcEncapDecapResult> {
  const response = await fetch('/api/pqc/hqc/encap-decap', {
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
  // FN-DSA has no assigned OID yet, so there's no PEM to show - only
  // ML-DSA/SLH-DSA (real OpenSSL-backed, real OIDs) populate this.
  publicPem?: string
  message: string
  signatureHex: string
  signatureBytes: number
  verified: boolean
}

async function signAndVerify(
  endpoint: 'ml-dsa' | 'slh-dsa' | 'fn-dsa',
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

export function signAndVerifyFnDsa(variant: string, message: string) {
  return signAndVerify('fn-dsa', variant, message)
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

export function fetchHqcSpeed() {
  return fetchSpeed('hqc')
}

export function fetchFnDsaSpeed() {
  return fetchSpeed('fn-dsa')
}
