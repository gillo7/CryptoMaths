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
