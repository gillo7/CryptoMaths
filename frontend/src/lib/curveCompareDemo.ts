export interface CurvePem {
  curve: string
  publicPem: string
  privatePem: string
}

export async function generateAllCurveKeys(): Promise<CurvePem[]> {
  const response = await fetch('/api/ecdh/keygen-all', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data.results
}

export interface CurveSpeedResult {
  curve: string
  ms: number
}

export async function measureCurveSpeed(): Promise<CurveSpeedResult[]> {
  const response = await fetch('/api/ecdh/curve-speed', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data.results
}
