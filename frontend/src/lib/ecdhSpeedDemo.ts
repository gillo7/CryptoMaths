export interface SpeedResult {
  label: string
  ms: number
}

export interface DhSpeedComparison {
  dhSharedGroup: SpeedResult
  dhFreshParams: SpeedResult
  ecdh: SpeedResult
}

export async function measureDhSpeed(): Promise<DhSpeedComparison> {
  const response = await fetch('/api/ecdh/dh-speed', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
