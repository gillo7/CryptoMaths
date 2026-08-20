import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8097
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/bin/openssl'
const TIMEOUT_MS = 10_000
const MAX_DATA_HEX_LEN = 20_000 // 10KB of plaintext/ciphertext
const MAX_KEY_IV_HEX_LEN = 128 // 64 bytes, comfortably covers every cipher below

// Curated list of ciphers the frontend can select, matching exactly what
// the Symmetric Encryption lesson covers. Twofish and Salsa20 are
// deliberately absent - OpenSSL has never implemented either, which is
// itself part of their story (see their lesson pages).
const ALLOWED_CIPHERS = new Set([
  // AES (GCM/AEAD handled separately, not yet supported by this endpoint)
  'aes-128-cbc', 'aes-128-ecb', 'aes-128-cfb', 'aes-128-ofb', 'aes-128-ctr',
  'aes-192-cbc', 'aes-192-ecb', 'aes-192-cfb', 'aes-192-ofb', 'aes-192-ctr',
  'aes-256-cbc', 'aes-256-ecb', 'aes-256-cfb', 'aes-256-ofb', 'aes-256-ctr',
  // DES / 3DES
  'des-cbc', 'des-ecb', 'des-cfb', 'des-ofb',
  'des-ede3-cbc', 'des-ede3-cfb', 'des-ede3-ofb', 'des-ede3',
  // Blowfish
  'bf-cbc', 'bf-ecb', 'bf-cfb', 'bf-ofb',
  // RC2 (rc2-64-cbc and rc2-40-cbc are the reduced effective-key-strength
  // variants - the latter matches the deliberately weakened 40-bit export
  // cipher covered in the lesson)
  'rc2-cbc', 'rc2-ecb', 'rc2-cfb', 'rc2-ofb', 'rc2-64-cbc', 'rc2-40-cbc',
  // Stream ciphers
  'rc4', 'chacha20',
])

const HEX_PATTERN = /^[0-9a-f]*$/i

function isValidHex(value, maxLen) {
  return (
    typeof value === 'string' &&
    value.length % 2 === 0 &&
    value.length <= maxLen &&
    HEX_PATTERN.test(value)
  )
}

// Runs `openssl enc` to encrypt or decrypt. Always loads the legacy
// provider alongside the default one - harmless for modern ciphers, and
// required for DES/RC2/Blowfish/RC4, which OpenSSL 3.x disables unless
// asked for explicitly. All I/O goes through temp files, never shell
// strings, so there's no injection surface regardless of input.
async function runOpenssl({ cipher, decrypt, keyHex, ivHex, noPad, dataHex }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'openssl-'))
  const inFile = path.join(dir, 'in.bin')
  const outFile = path.join(dir, 'out.bin')
  try {
    await writeFile(inFile, Buffer.from(dataHex, 'hex'))

    const args = [
      'enc',
      `-${cipher}`,
      decrypt ? '-d' : '-e',
      '-provider', 'legacy',
      '-provider', 'default',
      '-K', keyHex,
      '-in', inFile,
      '-out', outFile,
    ]
    if (ivHex) args.push('-iv', ivHex)
    if (noPad) args.push('-nopad')

    await execFile(OPENSSL_BIN, args, { timeout: TIMEOUT_MS })
    const result = await readFile(outFile)
    return { ok: true, dataHex: result.toString('hex') }
  } catch (err) {
    // Wrong key, bad padding, tampered ciphertext, etc. all surface here -
    // that's a real, useful result for this demo, not just a failure mode.
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    const message =
      stderr
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .pop() || 'openssl command failed'
    return { ok: false, error: message }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Fixed set of ciphers benchmarked together, matching exactly what the
// Block Ciphers section covers (Twofish excluded deliberately - it has no
// OpenSSL implementation, so it can't be measured the same way). ChaCha20
// is a stream cipher, not a block cipher, but it's included here too since
// the AES-NI text right above this benchmark names it as AES's real-world
// alternative on unaccelerated hardware - the comparison is the whole
// point of that paragraph.
const BENCHMARK_CIPHERS = [
  { cipher: 'des-cbc', label: 'DES' },
  { cipher: 'des-ede3-cbc', label: '3DES' },
  { cipher: 'rc2-cbc', label: 'RC2' },
  { cipher: 'bf-cbc', label: 'Blowfish' },
  { cipher: 'aes-128-cbc', label: 'AES-128' },
  { cipher: 'aes-192-cbc', label: 'AES-192' },
  { cipher: 'aes-256-cbc', label: 'AES-256' },
  { cipher: 'chacha20', label: 'ChaCha20' },
]
const BENCHMARK_SECONDS = 1
const BENCHMARK_BUFFER_BYTES = 8192
// Real per-cipher openssl speed runs are ~1s (BENCHMARK_SECONDS) each, so
// the full sweep of 7 ciphers takes ~7s - this just needs comfortable
// margin per invocation, not a tuned constraint.
const BENCHMARK_TIMEOUT_MS = 10_000

// Runs `openssl speed`, OpenSSL's own built-in benchmarking tool, rather
// than timing repeated `enc` invocations ourselves - each `enc` call's
// process-spawn overhead would dwarf the actual encryption time for a
// small amount of data, making every cipher look artificially similar.
// `speed` measures raw library throughput with no such distortion.
async function benchmarkCipher(cipher) {
  const args = [
    'speed',
    '-seconds', String(BENCHMARK_SECONDS),
    '-bytes', String(BENCHMARK_BUFFER_BYTES),
    '-evp', cipher,
    '-provider', 'legacy',
    '-provider', 'default',
    '-mr',
  ]
  const { stdout } = await execFile(OPENSSL_BIN, args, {
    timeout: BENCHMARK_TIMEOUT_MS,
  })
  // Machine-readable summary line: +F:<count>:<algo>:<bytes-per-second>
  const line = stdout.split('\n').find((l) => l.startsWith('+F:'))
  if (!line) throw new Error('no result line from openssl speed')
  const bytesPerSecond = parseFloat(line.split(':').pop())
  if (!Number.isFinite(bytesPerSecond)) throw new Error('could not parse result')
  return bytesPerSecond
}

async function runBenchmarks() {
  const results = []
  // Sequential, not parallel - concurrent runs would compete for CPU and
  // distort every result.
  for (const { cipher, label } of BENCHMARK_CIPHERS) {
    try {
      const bytesPerSecond = await benchmarkCipher(cipher)
      results.push({ label, bytesPerSecond })
    } catch {
      results.push({ label, bytesPerSecond: null })
    }
  }
  return results
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function validateRequest(body) {
  if (typeof body.cipher !== 'string' || !ALLOWED_CIPHERS.has(body.cipher)) {
    return 'cipher must be one of the supported algorithms'
  }
  if (!isValidHex(body.keyHex, MAX_KEY_IV_HEX_LEN) || body.keyHex.length === 0) {
    return 'keyHex must be a non-empty hex string'
  }
  if (body.ivHex !== undefined && !isValidHex(body.ivHex, MAX_KEY_IV_HEX_LEN)) {
    return 'ivHex must be a hex string'
  }
  if (!isValidHex(body.dataHex, MAX_DATA_HEX_LEN)) {
    return 'dataHex must be a hex string (max 10KB)'
  }
  return null
}

async function handleRequest(req, decrypt) {
  const body = await readJsonBody(req)
  const validationError = validateRequest(body)
  if (validationError) {
    return { status: 400, body: { error: validationError } }
  }
  const result = await runOpenssl({
    cipher: body.cipher,
    decrypt,
    keyHex: body.keyHex,
    ivHex: body.ivHex,
    noPad: Boolean(body.noPad),
    dataHex: body.dataHex,
  })
  return { status: 200, body: result }
}

// The benchmark takes several seconds of real CPU time - only one runs at
// a time so concurrent visitors don't skew each other's results.
let benchmarkQueue = Promise.resolve()

function enqueueBenchmark() {
  const job = benchmarkQueue.then(runBenchmarks, runBenchmarks)
  benchmarkQueue = job.then(
    () => {},
    () => {},
  )
  return job
}

const server = http.createServer(async (req, res) => {
  const route = req.method === 'POST' ? req.url : null

  if (route === '/benchmark') {
    const results = await enqueueBenchmark()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ results }))
    return
  }

  if (route !== '/enc' && route !== '/dec') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  try {
    const { status, body } = await handleRequest(req, route === '/dec')
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`openssl backend listening on 127.0.0.1:${PORT}`)
})
