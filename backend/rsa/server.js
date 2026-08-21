import { execFile as execFileCb } from 'node:child_process'
import { createPrivateKey, createPublicKey, randomInt } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8098
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/bin/openssl'
const TIMEOUT_MS = 10_000

// 512 is OpenSSL's own enforced floor (anything smaller is rejected by the
// default provider with "key size too small") - not a choice made for this
// demo, a hard limit of the tool itself.
const ALLOWED_BITS = new Set([512, 1024, 2048])

// Strips whitespace/newlines/colons from an `openssl rsa -text` field
// block, then drops a single leading "00" byte if present - that's just
// DER sign-bit padding (added whenever the field's true high bit is set,
// so the value isn't misread as a negative ASN.1 INTEGER), not part of the
// actual number, and it looks like a typo to a reader.
function cleanHexField(block) {
  let hex = block.replace(/[\s:]/g, '')
  if (hex.startsWith('00') && hex.length % 2 === 0) hex = hex.slice(2)
  return hex
}

// `openssl rsa -text` prints each big-number field as a label line followed
// by indented, colon-separated hex byte lines until the next label (or a
// non-indented publicExponent line, which prints inline on the same line
// instead of wrapping). This pulls the block that follows a given label.
function extractField(text, label) {
  const pattern = new RegExp(`${label}:\\n((?:[ \\t]+[0-9a-f:]+\\n?)+)`, 'i')
  const match = text.match(pattern)
  if (!match) return null
  return cleanHexField(match[1])
}

async function generateKey(bits) {
  const dir = await mkdtemp(path.join(tmpdir(), 'rsa-'))
  const keyFile = path.join(dir, 'key.pem')
  try {
    await execFile(OPENSSL_BIN, ['genrsa', '-out', keyFile, String(bits)], {
      timeout: TIMEOUT_MS,
    })
    const privatePem = await readFile(keyFile, 'utf8')
    const { stdout: text } = await execFile(
      OPENSSL_BIN,
      ['rsa', '-in', keyFile, '-text', '-noout'],
      { timeout: TIMEOUT_MS },
    )
    const { stdout: publicPem } = await execFile(
      OPENSSL_BIN,
      ['rsa', '-in', keyFile, '-pubout'],
      { timeout: TIMEOUT_MS },
    )
    const exponentMatch = text.match(/publicExponent: (\d+)/)
    return {
      bits,
      privatePem,
      publicPem,
      n: extractField(text, 'modulus'),
      e: exponentMatch ? exponentMatch[1] : null,
      d: extractField(text, 'privateExponent'),
      p: extractField(text, 'prime1'),
      q: extractField(text, 'prime2'),
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Two 40-bit primes give an ~80-bit N - small enough to factor live, but
// large enough that Pollard's rho takes a genuinely visible amount of time
// on this site's Raspberry Pi (~10s on average, benchmarked empirically
// before picking this size), rather than finishing instantly and
// undercutting the point of watching a key actually get broken.
const WEAK_PRIME_BITS = 40
const WEAK_E = 65537n

// A crafted or malicious /break request could submit a huge or prime n -
// Pollard's rho's cost depends entirely on the size of the smallest
// factor, so an unfactorable input (or one far bigger than anything this
// demo generates) could otherwise run close to forever. This caps accepted
// input to comfortably above what /weak-keygen ever produces and nothing
// more, and pollardsRho() below has its own hard iteration ceiling as a
// second line of defence.
const MAX_BREAK_BITS = 88
const POLLARD_MAX_ITERATIONS = 20_000_000

function modPowBig(base, exponent, modulus) {
  let result = 1n
  base = base % modulus
  while (exponent > 0n) {
    if (exponent & 1n) result = (result * base) % modulus
    exponent >>= 1n
    base = (base * base) % modulus
  }
  return result
}

function gcdBig(a, b) {
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a
}

// Miller-Rabin primality test. Witnesses only need to be well-distributed,
// not secret, so Node's randomInt (fine at this bit size, well under its
// 2^48 range limit) is enough - no need for constant-time or CSPRNG-grade
// care here, unlike key material itself.
function isProbablePrime(n, rounds = 20) {
  if (n < 2n) return false
  if (n === 2n || n === 3n) return true
  if (n % 2n === 0n) return false
  let d = n - 1n
  let r = 0n
  while (d % 2n === 0n) {
    d /= 2n
    r++
  }
  witnessLoop: for (let i = 0; i < rounds; i++) {
    const a = BigInt(randomInt(2, Number(n - 2n)))
    let x = modPowBig(a, d, n)
    if (x === 1n || x === n - 1n) continue
    for (let j = 0n; j < r - 1n; j++) {
      x = (x * x) % n
      if (x === n - 1n) continue witnessLoop
    }
    return false
  }
  return true
}

function randomPrime(bits) {
  while (true) {
    const candidate = BigInt(randomInt(2 ** (bits - 1), 2 ** bits)) | 1n
    if (isProbablePrime(candidate)) return candidate
  }
}

function modInverseBig(e, phi) {
  let [oldR, r] = [e, phi]
  let [oldS, s] = [1n, 0n]
  while (r !== 0n) {
    const quotient = oldR / r
    ;[oldR, r] = [r, oldR - quotient * r]
    ;[oldS, s] = [s, oldS - quotient * s]
  }
  return ((oldS % phi) + phi) % phi
}

function hexToBigInt(hex) {
  return BigInt(`0x${hex || '0'}`)
}

function bigIntToHex(n) {
  let hex = n.toString(16)
  if (hex.length % 2) hex = `0${hex}`
  return hex
}

function bigIntToBase64Url(n) {
  return Buffer.from(bigIntToHex(n), 'hex').toString('base64url')
}

// OpenSSL's own CLI refuses to generate (or even load) RSA keys below 512
// bits - a policy choice, not a mathematical one. Node's crypto module has
// no such floor: building a JWK by hand from raw n/e (or n/e/d/p/q for a
// private key) and importing it produces a real, standards-correct PEM at
// any size, which is what makes a genuinely small, breakable key possible
// at all here.
function buildPublicPem(n, e) {
  const jwk = { kty: 'RSA', n: bigIntToBase64Url(n), e: bigIntToBase64Url(e) }
  return createPublicKey({ key: jwk, format: 'jwk' }).export({
    type: 'spki',
    format: 'pem',
  })
}

function buildPrivatePem(n, e, d, p, q) {
  const dp = d % (p - 1n)
  const dq = d % (q - 1n)
  const qi = modInverseBig(q, p)
  const jwk = {
    kty: 'RSA',
    n: bigIntToBase64Url(n),
    e: bigIntToBase64Url(e),
    d: bigIntToBase64Url(d),
    p: bigIntToBase64Url(p),
    q: bigIntToBase64Url(q),
    dp: bigIntToBase64Url(dp),
    dq: bigIntToBase64Url(dq),
    qi: bigIntToBase64Url(qi),
  }
  return createPrivateKey({ key: jwk, format: 'jwk' }).export({
    type: 'pkcs8',
    format: 'pem',
  })
}

// Generates a real, deliberately small RSA key pair, but only ever
// returns the public half - p, q, and d never leave this function. That
// mirrors what a real attacker actually starts with: the public key, and
// nothing else.
function generateWeakKeyPair() {
  let p, q, n, phi
  do {
    p = randomPrime(WEAK_PRIME_BITS)
    q = randomPrime(WEAK_PRIME_BITS)
    n = p * q
    phi = (p - 1n) * (q - 1n)
  } while (p === q || gcdBig(WEAK_E, phi) !== 1n)

  return {
    bits: n.toString(2).length,
    n: bigIntToHex(n),
    e: bigIntToHex(WEAK_E),
    publicPem: buildPublicPem(n, WEAK_E),
  }
}

// Floyd's cycle-finding variant of Pollard's rho. Bails out with null past
// POLLARD_MAX_ITERATIONS rather than run unbounded - see MAX_BREAK_BITS
// above for why that matters.
function pollardsRho(n) {
  if (n % 2n === 0n) return 2n
  let x = 2n
  let y = 2n
  let d = 1n
  const f = (v) => (v * v + 1n) % n
  let iterations = 0
  while (d === 1n) {
    if (++iterations > POLLARD_MAX_ITERATIONS) return null
    x = f(x)
    y = f(f(y))
    d = gcdBig(x > y ? x - y : y - x, n)
  }
  return d === n ? null : d
}

// Takes only n and e (everything a real attacker would have from the
// public key alone) and recovers the rest: factor n back into p and q,
// rebuild phi, and derive d exactly as the legitimate key generation
// would have.
function breakKey(nHex, eHex) {
  const n = hexToBigInt(nHex)
  const e = hexToBigInt(eHex)
  if (n.toString(2).length > MAX_BREAK_BITS) {
    throw new Error(`n must be at most ${MAX_BREAK_BITS} bits`)
  }

  const t0 = performance.now()
  const factor = pollardsRho(n)
  const factorMs = performance.now() - t0
  if (!factor) throw new Error('failed to factor n')

  const other = n / factor
  const [p, q] = factor < other ? [factor, other] : [other, factor]
  const phi = (p - 1n) * (q - 1n)
  const d = modInverseBig(e, phi)

  return {
    p: bigIntToHex(p),
    q: bigIntToHex(q),
    d: bigIntToHex(d),
    privatePem: buildPrivatePem(n, e, d, p, q),
    factorMs,
  }
}

const SPEED_TEST_SECONDS = 2
const SPEED_TIMEOUT_MS = 15_000

// Runs OpenSSL's own `speed` tool rather than timing repeated sign/verify
// calls ourselves - same reasoning as the Symmetric Encryption cipher
// benchmarks: process-spawn overhead would dwarf a single operation's real
// cost. RSA-2048 and ECDSA P-256 are roughly the same real-world security
// level (the "2048-bit RSA security in a 256-bit key" comparison the
// surrounding text makes), so this is a direct apples-to-apples measure of
// what that efficiency gain actually costs or buys in practice.
async function measureAsymmetricSpeed() {
  const args = [
    'speed',
    '-seconds',
    String(SPEED_TEST_SECONDS),
    '-mr',
    'rsa2048',
    'ecdsap256',
  ]
  const { stdout } = await execFile(OPENSSL_BIN, args, {
    timeout: SPEED_TIMEOUT_MS,
  })
  const lines = stdout.split('\n')

  // +F2:<index>:<bits>:<sign/s>:<verify/s> for RSA, +F4 for ECDSA - same
  // trailing shape, different algorithm-family prefix.
  function parseResultLine(prefix, label) {
    const line = lines.find((l) => l.startsWith(prefix))
    if (!line) return null
    const parts = line.split(':')
    return {
      label,
      bits: Number(parts[2]),
      signPerSec: parseFloat(parts[3]),
      verifyPerSec: parseFloat(parts[4]),
    }
  }

  const rsa = parseResultLine('+F2:', 'RSA-2048')
  const ecdsa = parseResultLine('+F4:', 'ECDSA P-256')

  // RSA keygen is slow enough that 2 reps already gives a stable-ish
  // average without adding much wait; ECDSA keygen is fast enough that a
  // few more reps costs almost nothing and smooths out noise.
  if (rsa) {
    rsa.keygenMs = await measureKeygenMs(['genrsa', '2048'], 2)
  }
  if (ecdsa) {
    ecdsa.keygenMs = await measureKeygenMs(
      ['genpkey', '-algorithm', 'EC', '-pkeyopt', 'ec_paramgen_curve:P-256'],
      5,
    )
  }

  return { rsa, ecdsa }
}

// `openssl speed` deliberately reuses one pre-generated key for its whole
// sign/verify run - it's benchmarking the sign/verify operations
// themselves, not key generation, so this measures that separately by
// timing real `genrsa`/`genpkey` invocations directly. This is the number
// that actually matches the "RSA in practice" section above: finding two
// large random primes is real, variable-cost work, unlike ECDSA, which
// just picks a random scalar against an already-defined curve.
async function measureKeygenMs(args, repetitions) {
  const timings = []
  for (let i = 0; i < repetitions; i++) {
    const t0 = performance.now()
    await execFile(OPENSSL_BIN, args, { timeout: SPEED_TIMEOUT_MS })
    timings.push(performance.now() - t0)
  }
  return timings.reduce((a, b) => a + b, 0) / timings.length
}

// Same single-flight reasoning as the Symmetric Encryption benchmarks -
// this pins the CPU for several seconds, so concurrent visitors shouldn't
// run it at the same time and skew each other's results.
let speedQueue = Promise.resolve()

function enqueueSpeedTest() {
  const job = speedQueue.then(measureAsymmetricSpeed, measureAsymmetricSpeed)
  speedQueue = job.then(
    () => {},
    () => {},
  )
  return job
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 4 * 1024) throw new Error('body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const server = http.createServer(async (req, res) => {
  const route = req.method === 'POST' ? req.url : null

  if (route === '/speed') {
    try {
      const result = await enqueueSpeedTest()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route === '/weak-keygen') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(generateWeakKeyPair()))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route === '/break') {
    try {
      const body = await readJsonBody(req)
      if (typeof body.n !== 'string' || typeof body.e !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'n and e must be hex strings' }))
        return
      }
      const result = breakKey(body.n, body.e)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route !== '/keygen') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  try {
    const body = await readJsonBody(req)
    const bits = Number(body.bits)
    if (!ALLOWED_BITS.has(bits)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'bits must be one of 512, 1024, 2048' }))
      return
    }
    const result = await generateKey(bits)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`rsa backend listening on 127.0.0.1:${PORT}`)
})
