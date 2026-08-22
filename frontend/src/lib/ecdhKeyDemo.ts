export interface EcdhKeyPair {
  curve: string
  privatePem: string
  publicPem: string
}

export async function generateEcdhKey(curve: string): Promise<EcdhKeyPair> {
  const response = await fetch('/api/ecdh/keygen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curve }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
