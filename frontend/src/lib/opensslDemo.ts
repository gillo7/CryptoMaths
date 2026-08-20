// Generic hex helpers live in hexUtils.ts - re-exported here so existing
// imports from this file keep working unchanged.
export {
  bytesToHex,
  hexToBytes,
  hexToText,
  randomHex,
  textToHex,
} from './hexUtils'

export interface OpensslResult {
  ok: boolean
  dataHex?: string
  error?: string
}

interface OpensslRequest {
  cipher: string
  keyHex: string
  ivHex?: string
  dataHex: string
  noPad?: boolean
}

async function callOpenssl(
  endpoint: 'enc' | 'dec',
  request: OpensslRequest,
): Promise<OpensslResult> {
  try {
    const response = await fetch(`/api/openssl/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const data = await response.json()
    if (!response.ok) return { ok: false, error: data.error ?? 'request failed' }
    return data
  } catch {
    return { ok: false, error: 'network error' }
  }
}

export function opensslEncrypt(request: OpensslRequest): Promise<OpensslResult> {
  return callOpenssl('enc', request)
}

export function opensslDecrypt(request: OpensslRequest): Promise<OpensslResult> {
  return callOpenssl('dec', request)
}
