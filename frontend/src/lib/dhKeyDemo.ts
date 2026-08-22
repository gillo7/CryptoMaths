export interface DhKeyPair {
  group: string
  privatePem: string
  publicPem: string
}

export async function generateDhKey(group: string): Promise<DhKeyPair> {
  const response = await fetch('/api/ecdh/dh-keygen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
