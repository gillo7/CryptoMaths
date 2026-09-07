export interface TlsCheckResult {
  id: string
  label: string
  supported: boolean
  protocol?: string
  cipher?: string
}

export interface TlsScanResult {
  yourConnection: {
    protocol: string | null
    cipher: string | null
  }
  serverChecks: TlsCheckResult[]
}

export async function runTlsScan(): Promise<TlsScanResult> {
  const response = await fetch('/api/tls/scan', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'request failed')
  return data
}
