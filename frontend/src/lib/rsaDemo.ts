export interface RsaKey {
  bits: number
  privatePem: string
  publicPem: string
  n: string
  e: string
  d: string
  p: string
  q: string
}

export async function generateRsaKey(bits: number): Promise<RsaKey> {
  const response = await fetch('/api/rsa/keygen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bits }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface WeakPublicKey {
  bits: number
  n: string
  e: string
  publicPem: string
}

export async function generateWeakRsaKey(): Promise<WeakPublicKey> {
  const response = await fetch('/api/rsa/weak-keygen', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}

export interface BrokenRsaKey {
  p: string
  q: string
  d: string
  privatePem: string
  factorMs: number
}

export async function breakRsaKey(n: string, e: string): Promise<BrokenRsaKey> {
  const response = await fetch('/api/rsa/break', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ n, e }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
