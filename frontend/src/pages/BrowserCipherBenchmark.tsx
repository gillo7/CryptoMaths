import { chacha20 } from '@noble/ciphers/chacha.js'
import { useState } from 'react'

interface BenchResult {
  label: string
  bytesPerSecond: number
}

const CHUNK_BYTES = 2_000_000
const DURATION_MS = 500

// crypto.getRandomValues caps out at 65536 bytes per call, far below the
// buffer size needed for a stable throughput measurement. The content of
// the bulk data being encrypted doesn't matter for a timing benchmark, so
// a plain byte pattern stands in - only the key/IV/nonce need to be
// cryptographically random, and those stay well under the limit.
function fillerBytes(length: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(length))
  for (let i = 0; i < length; i++) out[i] = i & 0xff
  return out
}

// Real native AES via the browser's own WebCrypto implementation - Chrome,
// Firefox, and Safari all delegate this to their underlying crypto library
// (BoringSSL, NSS, etc.), which uses AES-NI when the device has it. This is
// what actually lets AES catch up with ChaCha20 on modern hardware, unlike
// the server-side benchmark elsewhere on this page, which always runs on
// this site's non-accelerated ARM chip regardless of your device.
async function timeAesThroughput(durationMs: number): Promise<number> {
  const key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, false, [
    'encrypt',
  ])
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const chunk = fillerBytes(CHUNK_BYTES)
  let bytes = 0
  const start = performance.now()
  while (performance.now() - start < durationMs) {
    await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, chunk)
    bytes += CHUNK_BYTES
  }
  return bytes / ((performance.now() - start) / 1000)
}

// ChaCha20 has no browser-native equivalent, so this is a small verified
// pure-JS implementation (@noble/ciphers) - cross-checked against this
// site's own OpenSSL backend on a fixed key/nonce/plaintext, byte-identical
// output. That's a fair comparison for the point being made: ChaCha20 was
// designed to be fast without any hardware help, so a plain JS
// implementation is a reasonable stand-in for it, while AES genuinely needs
// WebCrypto's native path to show what dedicated hardware buys it.
function timeChaCha20Throughput(durationMs: number): number {
  const key = crypto.getRandomValues(new Uint8Array(32))
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const chunk = fillerBytes(CHUNK_BYTES)
  let bytes = 0
  const start = performance.now()
  while (performance.now() - start < durationMs) {
    chacha20(key, nonce, chunk)
    bytes += CHUNK_BYTES
  }
  return bytes / ((performance.now() - start) / 1000)
}

function formatThroughput(bytesPerSecond: number): string {
  return `${(bytesPerSecond / 1_000_000).toFixed(1)} MB/s`
}

function BrowserCipherBenchmark() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<BenchResult[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)
    try {
      // Sequential, not parallel - same reasoning as the server benchmark:
      // running both at once would have them compete for CPU and distort
      // both results.
      const aes = await timeAesThroughput(DURATION_MS)
      const chacha = timeChaCha20Throughput(DURATION_MS)
      const sorted = [
        { label: 'AES-256 (WebCrypto, native)', bytesPerSecond: aes },
        { label: 'ChaCha20 (JS)', bytesPerSecond: chacha },
      ].sort((a, b) => b.bytesPerSecond - a.bytesPerSecond)
      setResults(sorted)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>
        This runs on your own device, right now, in this tab - nothing to
        install. It measures native AES via your browser's own WebCrypto
        implementation against a verified JS ChaCha20, so it reflects
        whatever hardware you're reading this on.
      </p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Benchmarking…' : 'Run a benchmark on this device'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.label}>
              <span className="multibox-label">{r.label}</span>
              <code className="multibox-value">{formatThroughput(r.bytesPerSecond)}</code>
            </div>
          ))}
        </div>
      )}

      {results && (
        <p className="demo-note">
          If AES comes out ahead here but lost to ChaCha20 in the
          server-side benchmark above, that's AES-NI (or your device's
          equivalent) doing exactly what it's designed to do - the whole
          story of this chapter, now visible on your own hardware.
        </p>
      )}
    </div>
  )
}

export default BrowserCipherBenchmark
