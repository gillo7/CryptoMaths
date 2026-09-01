import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8101
// Debian 12's system openssl is 3.0.20 - no ML-KEM/ML-DSA/SLH-DSA support
// (that landed in OpenSSL 3.5). This points at a separately built 3.5.8,
// installed to its own prefix rather than replacing the system openssl
// every other service on this box relies on.
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/local/ssl/bin/openssl'
const OPENSSL_LIB_PATH = process.env.OPENSSL_LIB_PATH || '/usr/local/ssl/lib'
const TIMEOUT_MS = 20_000
const MAX_MESSAGE_LENGTH = 500

const ML_KEM_VARIANTS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']
const ML_DSA_VARIANTS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']
const SLH_DSA_VARIANTS = [
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256s',
  'SLH-DSA-SHAKE-256f',
]

function opensslExec(args, options = {}) {
  return execFile(OPENSSL_BIN, args, {
    timeout: TIMEOUT_MS,
    env: { ...process.env, LD_LIBRARY_PATH: OPENSSL_LIB_PATH },
    ...options,
  })
}

function sanitizeMessage(value, fallback) {
  if (typeof value !== 'string') return fallback
  const cleaned = value.replace(/\r/g, '').trim().slice(0, MAX_MESSAGE_LENGTH)
  return cleaned || fallback
}

async function measureMs(fn) {
  const t0 = performance.now()
  await fn()
  return performance.now() - t0
}

// A KEM keypair, PEM in and out - same shape as the classical DH/ECDH
// keygen demos elsewhere on the site, just backed by a lattice algorithm
// instead of a curve or a prime.
async function generateKemKeypair(variant) {
  if (!ML_KEM_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${ML_KEM_VARIANTS.join(', ')}`)
  }
  const dir = await mkdtemp(path.join(tmpdir(), 'mlkem-'))
  const keyFile = path.join(dir, 'key.pem')
  const pubFile = path.join(dir, 'pub.pem')
  try {
    await opensslExec(['genpkey', '-algorithm', variant, '-out', keyFile])
    await opensslExec(['pkey', '-in', keyFile, '-pubout', '-out', pubFile])
    const privatePem = await readFile(keyFile, 'utf8')
    const publicPem = await readFile(pubFile, 'utf8')
    return { variant, publicPem, privatePem }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Alice's keypair, then Bob encapsulating against her public key (a
// fresh shared secret plus the ciphertext that carries it), then Alice
// decapsulating that ciphertext with her private key - real proof the
// two independently arrive at the identical secret, matching the u/v
// construction described on the page itself.
async function encapDecap(variant) {
  if (!ML_KEM_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${ML_KEM_VARIANTS.join(', ')}`)
  }
  const dir = await mkdtemp(path.join(tmpdir(), 'mlkem-encap-'))
  const keyFile = path.join(dir, 'key.pem')
  const pubFile = path.join(dir, 'pub.pem')
  const ctFile = path.join(dir, 'ct.bin')
  const bobSecretFile = path.join(dir, 'bob.secret')
  const aliceSecretFile = path.join(dir, 'alice.secret')
  try {
    await opensslExec(['genpkey', '-algorithm', variant, '-out', keyFile])
    await opensslExec(['pkey', '-in', keyFile, '-pubout', '-out', pubFile])
    await opensslExec([
      'pkeyutl', '-encap', '-inkey', pubFile, '-pubin', '-out', ctFile,
      '-secret', bobSecretFile,
    ])
    await opensslExec([
      'pkeyutl', '-decap', '-inkey', keyFile, '-in', ctFile, '-secret', aliceSecretFile,
    ])
    const publicPem = await readFile(pubFile, 'utf8')
    const ciphertext = await readFile(ctFile)
    const bobSecret = await readFile(bobSecretFile)
    const aliceSecret = await readFile(aliceSecretFile)
    return {
      variant,
      publicPem,
      ciphertextHex: ciphertext.toString('hex'),
      ciphertextBytes: ciphertext.length,
      bobSecretHex: bobSecret.toString('hex'),
      aliceSecretHex: aliceSecret.toString('hex'),
      matched: bobSecret.equals(aliceSecret),
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Real keygen -> sign -> verify for any of ML-DSA/SLH-DSA's direct
// message-signing schemes - openssl's pkeyutl with -rawin signs the
// message itself (these aren't hash-then-sign like RSA/ECDSA, the
// algorithm hashes internally as part of its own construction).
async function signAndVerify(variants, variant, message) {
  if (!variants.includes(variant)) {
    throw new Error(`variant must be one of ${variants.join(', ')}`)
  }
  const cleanMessage = sanitizeMessage(message, 'Hello, post-quantum world!')
  const dir = await mkdtemp(path.join(tmpdir(), 'pqcsign-'))
  const keyFile = path.join(dir, 'key.pem')
  const pubFile = path.join(dir, 'pub.pem')
  const msgFile = path.join(dir, 'msg.txt')
  const sigFile = path.join(dir, 'sig.bin')
  try {
    await opensslExec(['genpkey', '-algorithm', variant, '-out', keyFile])
    await opensslExec(['pkey', '-in', keyFile, '-pubout', '-out', pubFile])
    await writeFile(msgFile, cleanMessage)
    await opensslExec([
      'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-in', msgFile, '-out', sigFile,
    ])
    const { stdout: verifyOut } = await opensslExec([
      'pkeyutl', '-verify', '-pubin', '-inkey', pubFile, '-rawin', '-in', msgFile,
      '-sigfile', sigFile,
    ])
    const publicPem = await readFile(pubFile, 'utf8')
    const signature = await readFile(sigFile)
    return {
      variant,
      publicPem,
      message: cleanMessage,
      signatureHex: signature.toString('hex'),
      signatureBytes: signature.length,
      verified: verifyOut.includes('Verified Successfully'),
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Keygen timing across all three ML-KEM parameter sets, the hybrid
// IETF-recommended combination, and the classical algorithms ML-KEM
// replaces or hybridises with in TLS. X25519MLKEM768 is a real TLS 1.3
// group name (confirmed via `openssl list -tls-groups`), but there's
// no single encodable key behind it - a hybrid handshake genuinely is
// two independent key exchanges run side by side, so its cost is
// measured honestly as X25519 keygen + ML-KEM-768 keygen added
// together, not faked as one atomic genpkey call.
async function measureKemSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'mlkem-speed-'))
  try {
    const run = (args) => measureMs(() => opensslExec(args))
    const genpkey = (algorithm, file, extraOpts = []) =>
      run(['genpkey', '-algorithm', algorithm, ...extraOpts, '-out', path.join(dir, file)])

    const mlKem512Ms = await genpkey('ML-KEM-512', 'mlkem512.pem')
    const mlKem768Ms = await genpkey('ML-KEM-768', 'mlkem768.pem')
    const mlKem1024Ms = await genpkey('ML-KEM-1024', 'mlkem1024.pem')
    const x25519Ms = await genpkey('X25519', 'x25519.pem')
    const rsaMs = await genpkey('RSA', 'rsa.pem', ['-pkeyopt', 'rsa_keygen_bits:2048'])
    const p256Ms = await genpkey('EC', 'p256.pem', ['-pkeyopt', 'ec_paramgen_curve:P-256'])

    const results = [
      { label: 'ML-KEM-512', ms: mlKem512Ms },
      { label: 'ML-KEM-768', ms: mlKem768Ms },
      { label: 'ML-KEM-1024', ms: mlKem1024Ms },
      { label: 'X25519/ML-KEM-768 (hybrid)', ms: x25519Ms + mlKem768Ms },
      { label: 'RSA-2048', ms: rsaMs },
      { label: 'P-256', ms: p256Ms },
      { label: 'X25519', ms: x25519Ms },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Signing timing for every ML-DSA parameter set against its two
// classical peers - Ed25519 (fixed-shape, fast) and RSA-PSS (fixed-shape,
// also fast) are the baseline the "signing time carries real variance"
// point on the ML-DSA page is contrasted against.
async function measureDsaSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'mldsa-speed-'))
  try {
    const msgFile = path.join(dir, 'msg.txt')
    await writeFile(msgFile, 'Hello, post-quantum world!')
    const signWith = async (algorithm) => {
      const keyFile = path.join(dir, `${algorithm}.pem`)
      await opensslExec(['genpkey', '-algorithm', algorithm, '-out', keyFile])
      const sigFile = path.join(dir, `${algorithm}.sig`)
      return measureMs(() =>
        opensslExec([
          'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-in', msgFile, '-out', sigFile,
        ]),
      )
    }
    const signRsaPss = async () => {
      const keyFile = path.join(dir, 'rsa.pem')
      await opensslExec([
        'genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', keyFile,
      ])
      const sigFile = path.join(dir, 'rsa.sig')
      return measureMs(() =>
        opensslExec([
          'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-digest', 'sha256',
          '-pkeyopt', 'rsa_padding_mode:pss', '-in', msgFile, '-out', sigFile,
        ]),
      )
    }
    const results = [
      { label: 'Ed25519', ms: await signWith('Ed25519') },
      { label: 'RSA-PSS (2048-bit)', ms: await signRsaPss() },
      { label: 'ML-DSA-44', ms: await signWith('ML-DSA-44') },
      { label: 'ML-DSA-65', ms: await signWith('ML-DSA-65') },
      { label: 'ML-DSA-87', ms: await signWith('ML-DSA-87') },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Signing timing across SLH-DSA's small/fast tradeoff (s = smaller
// signature, slower; f = faster, larger signature) alongside ML-DSA-65
// and Ed25519, to show both gaps at once: hash-based vs lattice-based,
// and the internal s/f tradeoff within SLH-DSA itself.
async function measureSlhDsaSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'slhdsa-speed-'))
  try {
    const msgFile = path.join(dir, 'msg.txt')
    await writeFile(msgFile, 'Hello, post-quantum world!')
    const signWith = async (algorithm) => {
      const keyFile = path.join(dir, `${algorithm}.pem`)
      await opensslExec(['genpkey', '-algorithm', algorithm, '-out', keyFile])
      const sigFile = path.join(dir, `${algorithm}.sig`)
      return measureMs(() =>
        opensslExec([
          'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-in', msgFile, '-out', sigFile,
        ]),
      )
    }
    const results = [
      { label: 'Ed25519', ms: await signWith('Ed25519') },
      { label: 'ML-DSA-65', ms: await signWith('ML-DSA-65') },
      { label: 'SLH-DSA-SHAKE-128f', ms: await signWith('SLH-DSA-SHAKE-128f') },
      { label: 'SLH-DSA-SHAKE-128s', ms: await signWith('SLH-DSA-SHAKE-128s') },
      { label: 'SLH-DSA-SHAKE-256f', ms: await signWith('SLH-DSA-SHAKE-256f') },
      { label: 'SLH-DSA-SHAKE-256s', ms: await signWith('SLH-DSA-SHAKE-256s') },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
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

function respond(res, promise) {
  promise.then(
    (result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    },
    (err) => {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    },
  )
}

const server = http.createServer(async (req, res) => {
  const route = req.method === 'POST' ? req.url : null

  if (route === '/ml-kem/keygen') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, generateKemKeypair(body.variant))
    return
  }

  if (route === '/ml-kem/encap-decap') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, encapDecap(body.variant))
    return
  }

  if (route === '/ml-kem/speed') {
    respond(res, measureKemSpeed())
    return
  }

  if (route === '/ml-dsa/sign') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, signAndVerify(ML_DSA_VARIANTS, body.variant, body.message))
    return
  }

  if (route === '/ml-dsa/speed') {
    respond(res, measureDsaSpeed())
    return
  }

  if (route === '/slh-dsa/sign') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, signAndVerify(SLH_DSA_VARIANTS, body.variant, body.message))
    return
  }

  if (route === '/slh-dsa/speed') {
    respond(res, measureSlhDsaSpeed())
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`pqc backend listening on 127.0.0.1:${PORT}`)
})
