import { execFile as execFileCb, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

// import.meta.dirname needs Node 20.11+; this server runs on Node 18.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 8101
// Debian 12's system openssl is 3.0.20 - no ML-KEM/ML-DSA/SLH-DSA support
// (that landed in OpenSSL 3.5). This points at a separately built 3.5.8,
// installed to its own prefix rather than replacing the system openssl
// every other service on this box relies on.
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/local/ssl/bin/openssl'
const OPENSSL_LIB_PATH = process.env.OPENSSL_LIB_PATH || '/usr/local/ssl/lib'
const TIMEOUT_MS = 20_000
const MAX_MESSAGE_LENGTH = 500

const HQC_TOOL_BIN =
  process.env.HQC_TOOL_BIN || path.join(SCRIPT_DIR, 'vendor', 'hqc-tool')
const HQC_LIB_PATH =
  process.env.HQC_LIB_PATH || path.join(SCRIPT_DIR, 'vendor', 'liboqs-install', 'lib')
const HQC_VARIANTS = ['HQC-128', 'HQC-192', 'HQC-256']
// Same tool and liboqs install as HQC above - hqc-tool.c grew to cover
// both once FrodoKEM came up, rather than duplicating an identical tool
// under a second name.
const FRODOKEM_VARIANTS = [
  'FrodoKEM-640-AES', 'FrodoKEM-640-SHAKE',
  'FrodoKEM-976-AES', 'FrodoKEM-976-SHAKE',
  'FrodoKEM-1344-AES', 'FrodoKEM-1344-SHAKE',
]

// Same liboqs install HQC uses - Falcon is built into it too now.
const SIG_TOOL_BIN =
  process.env.SIG_TOOL_BIN || path.join(SCRIPT_DIR, 'vendor', 'sig-tool')
const FN_DSA_VARIANTS = ['Falcon-512', 'Falcon-1024']

const ML_KEM_VARIANTS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']
const ML_DSA_VARIANTS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']
// Matches the exact selection tested in benchmark.py for the
// dissertation this chapter draws from - SHA2 and SHAKE both covered,
// but only the SHAKE small (s) variant per level, not its fast (f)
// counterpart, since that's the set actually benchmarked there.
const SLH_DSA_VARIANTS = [
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-256s',
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

// At tens of milliseconds, a single run is dominated by process-spawn
// noise (fork/exec, dynamic linking, disk I/O), not the actual crypto
// cost - repeated, real ML-KEM-512/768/1024 keygen runs land in the
// same ~15-25ms band with no consistent size-based ordering, and can
// flip which one "wins" from run to run. The median of several runs
// cancels that out without hiding a genuinely slow outlier the way a
// mean would. 25 rather than a smaller number of repeats because some
// operations have real, substantial variance of their own - 25 real
// RSA-2048 keygens on this Pi ranged from 132ms to 850ms, so a handful
// of samples can land a misleadingly high or low median just by luck.
async function measureMedianMs(fn, repeats = 25) {
  const durations = []
  for (let i = 0; i < repeats; i++) {
    durations.push(await measureMs(fn))
  }
  durations.sort((a, b) => a - b)
  return durations[Math.floor(durations.length / 2)]
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

// The IETF-recommended X25519+ML-KEM-768 hybrid, run as two real,
// independent key exchanges rather than one fabricated call -
// X25519MLKEM768 is a TLS 1.3 group name, not a standalone encodable
// key (confirmed via `openssl list -tls-groups`; genpkey fails outright
// with "No encoders were found"), so there is no single OpenSSL command
// that performs the combined operation directly. Alice and Bob each run
// a full X25519 ECDH derivation, then Alice publishes an ML-KEM-768
// encapsulation key that Bob encapsulates against, and the two secrets
// are concatenated exactly as the page's own text describes - not any
// operation that could cancel information between the two halves.
async function hybridExchange() {
  const dir = await mkdtemp(path.join(tmpdir(), 'hybrid-'))
  try {
    const aliceX25519Key = path.join(dir, 'alice-x25519.pem')
    const aliceX25519Pub = path.join(dir, 'alice-x25519-pub.pem')
    const bobX25519Key = path.join(dir, 'bob-x25519.pem')
    const bobX25519Pub = path.join(dir, 'bob-x25519-pub.pem')
    await opensslExec(['genpkey', '-algorithm', 'X25519', '-out', aliceX25519Key])
    await opensslExec(['pkey', '-in', aliceX25519Key, '-pubout', '-out', aliceX25519Pub])
    await opensslExec(['genpkey', '-algorithm', 'X25519', '-out', bobX25519Key])
    await opensslExec(['pkey', '-in', bobX25519Key, '-pubout', '-out', bobX25519Pub])
    const aliceX25519SecretFile = path.join(dir, 'alice-x25519.secret')
    const bobX25519SecretFile = path.join(dir, 'bob-x25519.secret')
    await opensslExec([
      'pkeyutl', '-derive', '-inkey', aliceX25519Key, '-peerkey', bobX25519Pub,
      '-out', aliceX25519SecretFile,
    ])
    await opensslExec([
      'pkeyutl', '-derive', '-inkey', bobX25519Key, '-peerkey', aliceX25519Pub,
      '-out', bobX25519SecretFile,
    ])
    const aliceX25519Secret = await readFile(aliceX25519SecretFile)
    const bobX25519Secret = await readFile(bobX25519SecretFile)

    const mlkemKey = path.join(dir, 'mlkem.pem')
    const mlkemPub = path.join(dir, 'mlkem-pub.pem')
    await opensslExec(['genpkey', '-algorithm', 'ML-KEM-768', '-out', mlkemKey])
    await opensslExec(['pkey', '-in', mlkemKey, '-pubout', '-out', mlkemPub])
    const ctFile = path.join(dir, 'mlkem.ct')
    const bobMlkemSecretFile = path.join(dir, 'bob-mlkem.secret')
    const aliceMlkemSecretFile = path.join(dir, 'alice-mlkem.secret')
    await opensslExec([
      'pkeyutl', '-encap', '-inkey', mlkemPub, '-pubin', '-out', ctFile,
      '-secret', bobMlkemSecretFile,
    ])
    await opensslExec([
      'pkeyutl', '-decap', '-inkey', mlkemKey, '-in', ctFile, '-secret', aliceMlkemSecretFile,
    ])
    const bobMlkemSecret = await readFile(bobMlkemSecretFile)
    const aliceMlkemSecret = await readFile(aliceMlkemSecretFile)
    const ciphertext = await readFile(ctFile)

    const aliceCombined = Buffer.concat([aliceX25519Secret, aliceMlkemSecret])
    const bobCombined = Buffer.concat([bobX25519Secret, bobMlkemSecret])

    return {
      x25519SecretHex: aliceX25519Secret.toString('hex'),
      x25519SecretBytes: aliceX25519Secret.length,
      x25519Matched: aliceX25519Secret.equals(bobX25519Secret),
      mlkemCiphertextBytes: ciphertext.length,
      mlkemSecretHex: aliceMlkemSecret.toString('hex'),
      mlkemSecretBytes: aliceMlkemSecret.length,
      mlkemMatched: aliceMlkemSecret.equals(bobMlkemSecret),
      combinedSecretHex: aliceCombined.toString('hex'),
      combinedSecretBytes: aliceCombined.length,
      combinedMatched: aliceCombined.equals(bobCombined),
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// HQC has no assigned OID yet (still pre-standardisation), so OpenSSL's
// oqs-provider can't serialise HQC keys to PEM/DER at all - confirmed
// directly, every genpkey/pkeyutl invocation fails with "No encoders
// were found" regardless of format. This shells out to a small custom
// tool (hqc-tool.c, built by setup.sh) that calls liboqs's own C API
// directly instead, the same real reference implementation, just
// without going through OpenSSL's key-encoding layer. Output is hex,
// not PEM, since there's no standard encoding for these keys to use.
function hqcToolExec(args) {
  return execFile(HQC_TOOL_BIN, args, {
    timeout: TIMEOUT_MS,
    env: { ...process.env, LD_LIBRARY_PATH: HQC_LIB_PATH },
  })
}

async function generateHqcKeypair(variant) {
  if (!HQC_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${HQC_VARIANTS.join(', ')}`)
  }
  const { stdout } = await hqcToolExec(['keygen', variant])
  return JSON.parse(stdout)
}

async function hqcEncapDecap(variant) {
  if (!HQC_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${HQC_VARIANTS.join(', ')}`)
  }
  const keypair = JSON.parse((await hqcToolExec(['keygen', variant])).stdout)
  const encapped = JSON.parse(
    (await hqcToolExec(['encap', variant, keypair.publicKeyHex])).stdout,
  )
  const decapped = JSON.parse(
    (
      await hqcToolExec([
        'decap', variant, keypair.privateKeyHex, encapped.ciphertextHex,
      ])
    ).stdout,
  )
  return {
    variant,
    publicKeyHex: keypair.publicKeyHex,
    publicKeyBytes: keypair.publicKeyBytes,
    ciphertextHex: encapped.ciphertextHex,
    ciphertextBytes: encapped.ciphertextBytes,
    bobSecretHex: encapped.secretHex,
    aliceSecretHex: decapped.secretHex,
    matched: encapped.secretHex === decapped.secretHex,
  }
}

async function generateFrodoKemKeypair(variant) {
  if (!FRODOKEM_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${FRODOKEM_VARIANTS.join(', ')}`)
  }
  const { stdout } = await hqcToolExec(['keygen', variant])
  return JSON.parse(stdout)
}

async function frodoKemEncapDecap(variant) {
  if (!FRODOKEM_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${FRODOKEM_VARIANTS.join(', ')}`)
  }
  const keypair = JSON.parse((await hqcToolExec(['keygen', variant])).stdout)
  const encapped = JSON.parse(
    (await hqcToolExec(['encap', variant, keypair.publicKeyHex])).stdout,
  )
  const decapped = JSON.parse(
    (
      await hqcToolExec([
        'decap', variant, keypair.privateKeyHex, encapped.ciphertextHex,
      ])
    ).stdout,
  )
  return {
    variant,
    publicKeyHex: keypair.publicKeyHex,
    publicKeyBytes: keypair.publicKeyBytes,
    privateKeyBytes: keypair.privateKeyBytes,
    ciphertextHex: encapped.ciphertextHex,
    ciphertextBytes: encapped.ciphertextBytes,
    bobSecretHex: encapped.secretHex,
    aliceSecretHex: decapped.secretHex,
    matched: encapped.secretHex === decapped.secretHex,
  }
}

// Keygen timing across matching NIST security levels: ML-KEM-512 vs
// HQC-128 (Level 1), ML-KEM-768 vs HQC-192 (Level 3), ML-KEM-1024 vs
// HQC-256 (Level 5) - both land in the same tens-of-ms range on this
// hardware, so median-of-5 applies here for the same reason it does in
// measureKemSpeed above.
async function measureHqcVsKemSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'hqc-speed-'))
  try {
    const mlKemMs = (variant) =>
      measureMedianMs(() =>
        opensslExec(['genpkey', '-algorithm', variant, '-out', path.join(dir, `${variant}.pem`)]),
      )
    const hqcMs = (variant) => measureMedianMs(() => hqcToolExec(['keygen', variant]))

    const results = [
      { label: 'ML-KEM-512', ms: await mlKemMs('ML-KEM-512') },
      { label: 'HQC-128', ms: await hqcMs('HQC-128') },
      { label: 'ML-KEM-768', ms: await mlKemMs('ML-KEM-768') },
      { label: 'HQC-192', ms: await hqcMs('HQC-192') },
      { label: 'ML-KEM-1024', ms: await mlKemMs('ML-KEM-1024') },
      { label: 'HQC-256', ms: await hqcMs('HQC-256') },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Keygen timing across matching NIST security levels: ML-KEM-512 vs
// FrodoKEM-640 (Level 1), ML-KEM-768 vs FrodoKEM-976 (Level 3),
// ML-KEM-1024 vs FrodoKEM-1344 (Level 5) - SHAKE variant throughout,
// since that's the variant this chapter's own text and byte-size
// figures use. FrodoKEM's unstructured matrices make this the one
// keygen comparison on the site where the classical-structure cost is
// expected to actually show up as a real, visible gap, not just noise.
async function measureFrodoKemVsKemSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'frodokem-speed-'))
  try {
    const mlKemMs = (variant) =>
      measureMedianMs(() =>
        opensslExec(['genpkey', '-algorithm', variant, '-out', path.join(dir, `${variant}.pem`)]),
      )
    const frodoKemMs = (variant) => measureMedianMs(() => hqcToolExec(['keygen', variant]))

    const results = [
      { label: 'ML-KEM-512', ms: await mlKemMs('ML-KEM-512') },
      { label: 'FrodoKEM-640-SHAKE', ms: await frodoKemMs('FrodoKEM-640-SHAKE') },
      { label: 'ML-KEM-768', ms: await mlKemMs('ML-KEM-768') },
      { label: 'FrodoKEM-976-SHAKE', ms: await frodoKemMs('FrodoKEM-976-SHAKE') },
      { label: 'ML-KEM-1024', ms: await mlKemMs('ML-KEM-1024') },
      { label: 'FrodoKEM-1344-SHAKE', ms: await frodoKemMs('FrodoKEM-1344-SHAKE') },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// FN-DSA (Falcon) isn't at Initial Public Draft yet, let alone
// assigned an OID, so - same story as HQC - this calls liboqs's own
// OQS_SIG API directly (via sig-tool.c) instead of OpenSSL, which has
// no Falcon support at all (confirmed via `openssl list
// -signature-algorithms`). Falcon signatures are variable-length, so
// unlike ML-DSA/SLH-DSA below, the reported signatureBytes genuinely
// varies run to run - that's real, not a bug.
function sigToolExec(args) {
  return execFile(SIG_TOOL_BIN, args, {
    timeout: TIMEOUT_MS,
    env: { ...process.env, LD_LIBRARY_PATH: HQC_LIB_PATH },
  })
}

async function signAndVerifyFnDsa(variant, message) {
  if (!FN_DSA_VARIANTS.includes(variant)) {
    throw new Error(`variant must be one of ${FN_DSA_VARIANTS.join(', ')}`)
  }
  const cleanMessage = sanitizeMessage(message, 'Hello, post-quantum world!')
  const keypair = JSON.parse((await sigToolExec(['keygen', variant])).stdout)
  const signed = JSON.parse(
    (await sigToolExec(['sign', variant, keypair.privateKeyHex, cleanMessage])).stdout,
  )
  const verified = JSON.parse(
    (
      await sigToolExec([
        'verify', variant, keypair.publicKeyHex, cleanMessage, signed.signatureHex,
      ])
    ).stdout,
  )
  return {
    variant,
    message: cleanMessage,
    signatureHex: signed.signatureHex,
    signatureBytes: signed.signatureBytes,
    verified: verified.verified,
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
    const genpkey = (algorithm, file, extraOpts = []) =>
      measureMedianMs(() =>
        opensslExec(['genpkey', '-algorithm', algorithm, ...extraOpts, '-out', path.join(dir, file)]),
      )

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
// point on the ML-DSA page is contrasted against. All of these land in
// the same 15-30ms range as ML-KEM's keygen, so the same median-of-5
// treatment applies for the same reason - see measureKemSpeed above.
async function measureDsaSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'mldsa-speed-'))
  try {
    const msgFile = path.join(dir, 'msg.txt')
    await writeFile(msgFile, 'Hello, post-quantum world!')
    const signWith = async (algorithm) => {
      const keyFile = path.join(dir, `${algorithm}.pem`)
      await opensslExec(['genpkey', '-algorithm', algorithm, '-out', keyFile])
      const sigFile = path.join(dir, `${algorithm}.sig`)
      return measureMedianMs(() =>
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
      return measureMedianMs(() =>
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

// Signing timing across the full benchmark.py SLH-DSA selection (all
// nine, SHA2 and SHAKE, s and f where each is actually tested) alongside
// ML-DSA-65 and Ed25519 as fast baselines. Deliberately single-shot, not
// median-of-5 like the other two speed benchmarks - the six "s" variants
// alone already take upwards of 20s combined, so repeating everything
// 5x would risk the nginx proxy_read_timeout; the gaps here are wide
// enough (double-digit ms vs multi-second) that single-run noise was
// never the concern it was for ML-KEM/ML-DSA's tightly-clustered numbers.
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
    const results = [{ label: 'Ed25519', ms: await signWith('Ed25519') }]
    results.push({ label: 'ML-DSA-65', ms: await signWith('ML-DSA-65') })
    for (const variant of SLH_DSA_VARIANTS) {
      results.push({ label: variant, ms: await signWith(variant) })
    }
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Signing timing at matching NIST security levels: Falcon-512 vs
// ML-DSA-44 (Level 1), Falcon-1024 vs ML-DSA-87 (Level 5) - Falcon has
// no Level 3 parameter set, so there's no ML-DSA-65 pairing here,
// unlike the ML-KEM/HQC speed benchmark's three-way pairing. Ed25519
// stays as the classical baseline. Median-of-many for the same reason
// as every other fast (<50ms) benchmark on this site.
async function measureFnDsaSpeed() {
  const dir = await mkdtemp(path.join(tmpdir(), 'fndsa-speed-'))
  try {
    const msgFile = path.join(dir, 'msg.txt')
    await writeFile(msgFile, 'Hello, post-quantum world!')
    const signWithOpenssl = async (algorithm) => {
      const keyFile = path.join(dir, `${algorithm}.pem`)
      await opensslExec(['genpkey', '-algorithm', algorithm, '-out', keyFile])
      const sigFile = path.join(dir, `${algorithm}.sig`)
      return measureMedianMs(() =>
        opensslExec([
          'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-in', msgFile, '-out', sigFile,
        ]),
      )
    }
    const signWithSigTool = async (variant) => {
      const keypair = JSON.parse((await sigToolExec(['keygen', variant])).stdout)
      return measureMedianMs(() =>
        sigToolExec(['sign', variant, keypair.privateKeyHex, 'Hello, post-quantum world!']),
      )
    }

    const results = [
      { label: 'Ed25519', ms: await signWithOpenssl('Ed25519') },
      { label: 'Falcon-512', ms: await signWithSigTool('Falcon-512') },
      { label: 'ML-DSA-44', ms: await signWithOpenssl('ML-DSA-44') },
      { label: 'Falcon-1024', ms: await signWithSigTool('Falcon-1024') },
      { label: 'ML-DSA-87', ms: await signWithOpenssl('ML-DSA-87') },
    ]
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// ---- Unified cross-algorithm benchmark tool (hub page) ----
// Lets the reader pick an operation and any set of algorithms across
// the whole chapter, then runs every one of them for real, back to
// back, rather than the fixed per-page comparisons above. Reuses the
// same execution mechanisms as those (opensslExec, hqcToolExec,
// sigToolExec) - this is a selection layer over them, not a new way
// of running crypto.
const BENCHMARK_REPEATS = 10

const BENCHMARK_KEYGEN_CATALOG = [
  { id: 'x25519', label: 'X25519', category: 'Classical', algorithm: 'X25519' },
  { id: 'p256', label: 'P-256', category: 'Classical', algorithm: 'EC', extraOpts: ['-pkeyopt', 'ec_paramgen_curve:P-256'] },
  { id: 'ed25519', label: 'Ed25519', category: 'Classical', algorithm: 'Ed25519' },
  { id: 'rsa2048', label: 'RSA-2048', category: 'Classical', algorithm: 'RSA', extraOpts: ['-pkeyopt', 'rsa_keygen_bits:2048'] },
  { id: 'mlkem512', label: 'ML-KEM-512', category: 'ML-KEM', algorithm: 'ML-KEM-512' },
  { id: 'mlkem768', label: 'ML-KEM-768', category: 'ML-KEM', algorithm: 'ML-KEM-768' },
  { id: 'mlkem1024', label: 'ML-KEM-1024', category: 'ML-KEM', algorithm: 'ML-KEM-1024' },
  { id: 'hqc128', label: 'HQC-128', category: 'HQC', tool: 'hqc', variant: 'HQC-128' },
  { id: 'hqc192', label: 'HQC-192', category: 'HQC', tool: 'hqc', variant: 'HQC-192' },
  { id: 'hqc256', label: 'HQC-256', category: 'HQC', tool: 'hqc', variant: 'HQC-256' },
  { id: 'frodokem640', label: 'FrodoKEM-640-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-640-SHAKE' },
  { id: 'frodokem976', label: 'FrodoKEM-976-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-976-SHAKE' },
  { id: 'frodokem1344', label: 'FrodoKEM-1344-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-1344-SHAKE' },
  { id: 'hybrid', label: 'X25519 + ML-KEM-768 (hybrid)', category: 'Hybrid', hybridKeygen: true },
  { id: 'mldsa44', label: 'ML-DSA-44', category: 'ML-DSA', algorithm: 'ML-DSA-44' },
  { id: 'mldsa65', label: 'ML-DSA-65', category: 'ML-DSA', algorithm: 'ML-DSA-65' },
  { id: 'mldsa87', label: 'ML-DSA-87', category: 'ML-DSA', algorithm: 'ML-DSA-87' },
  { id: 'falcon512', label: 'Falcon-512', category: 'FN-DSA', tool: 'sig', variant: 'Falcon-512' },
  { id: 'falcon1024', label: 'Falcon-1024', category: 'FN-DSA', tool: 'sig', variant: 'Falcon-1024' },
  ...SLH_DSA_VARIANTS.map((v) => ({ id: v.toLowerCase(), label: v, category: 'SLH-DSA', algorithm: v })),
]

const BENCHMARK_ENCAP_DECAP_CATALOG = [
  { id: 'mlkem512', label: 'ML-KEM-512', category: 'ML-KEM', algorithm: 'ML-KEM-512' },
  { id: 'mlkem768', label: 'ML-KEM-768', category: 'ML-KEM', algorithm: 'ML-KEM-768' },
  { id: 'mlkem1024', label: 'ML-KEM-1024', category: 'ML-KEM', algorithm: 'ML-KEM-1024' },
  { id: 'hqc128', label: 'HQC-128', category: 'HQC', tool: 'hqc', variant: 'HQC-128' },
  { id: 'hqc192', label: 'HQC-192', category: 'HQC', tool: 'hqc', variant: 'HQC-192' },
  { id: 'hqc256', label: 'HQC-256', category: 'HQC', tool: 'hqc', variant: 'HQC-256' },
  { id: 'frodokem640', label: 'FrodoKEM-640-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-640-SHAKE' },
  { id: 'frodokem976', label: 'FrodoKEM-976-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-976-SHAKE' },
  { id: 'frodokem1344', label: 'FrodoKEM-1344-SHAKE', category: 'FrodoKEM', tool: 'hqc', variant: 'FrodoKEM-1344-SHAKE' },
  { id: 'hybrid', label: 'X25519 + ML-KEM-768 (hybrid)', category: 'Hybrid', hybridExchange: true },
]

const BENCHMARK_SIGN_VERIFY_CATALOG = [
  { id: 'ed25519', label: 'Ed25519', category: 'Classical', algorithm: 'Ed25519' },
  { id: 'rsapss2048', label: 'RSA-PSS (2048-bit)', category: 'Classical', rsaPss: true },
  { id: 'mldsa44', label: 'ML-DSA-44', category: 'ML-DSA', algorithm: 'ML-DSA-44' },
  { id: 'mldsa65', label: 'ML-DSA-65', category: 'ML-DSA', algorithm: 'ML-DSA-65' },
  { id: 'mldsa87', label: 'ML-DSA-87', category: 'ML-DSA', algorithm: 'ML-DSA-87' },
  { id: 'falcon512', label: 'Falcon-512', category: 'FN-DSA', tool: 'sig', variant: 'Falcon-512' },
  { id: 'falcon1024', label: 'Falcon-1024', category: 'FN-DSA', tool: 'sig', variant: 'Falcon-1024' },
  // The six "s" variants take 2-4s to sign, same real cost the SLH-DSA
  // page's own speed benchmark hits - single-shot only, not
  // median-of-many, matching measureSlhDsaSpeed's existing precedent.
  ...SLH_DSA_VARIANTS.map((v) => ({
    id: v.toLowerCase(),
    label: v,
    category: 'SLH-DSA',
    algorithm: v,
    slow: v.endsWith('s'),
  })),
]

const BENCHMARK_TLS_CATALOG = [
  { id: 'classical-x25519-ed25519', label: 'Classical (X25519 + Ed25519)', group: 'x25519', sigAlgorithm: 'Ed25519' },
  {
    id: 'classical-p256-rsa', label: 'Classical (P-256 + RSA-2048)', group: 'secp256r1',
    sigAlgorithm: 'RSA', extraKeyOpts: ['-pkeyopt', 'rsa_keygen_bits:2048'],
  },
  { id: 'mlkem768-mldsa65', label: 'Fully post-quantum (ML-KEM-768 + ML-DSA-65)', group: 'MLKEM768', sigAlgorithm: 'ML-DSA-65' },
  { id: 'hybrid-mldsa65', label: 'Hybrid + ML-DSA-65 (recommended migration path)', group: 'X25519MLKEM768', sigAlgorithm: 'ML-DSA-65' },
  {
    id: 'hybrid-classical-sig', label: 'Hybrid key exchange, classical signature (X25519MLKEM768 + ECDSA P-256)',
    group: 'X25519MLKEM768', sigAlgorithm: 'EC', extraKeyOpts: ['-pkeyopt', 'ec_paramgen_curve:P-256'],
  },
]

async function measureCatalogKeygenMs(entry, dir) {
  if (entry.hybridKeygen) {
    const xFile = path.join(dir, 'key.pem')
    const kFile = path.join(dir, 'key2.pem')
    return measureMedianMs(async () => {
      await opensslExec(['genpkey', '-algorithm', 'X25519', '-out', xFile])
      await opensslExec(['genpkey', '-algorithm', 'ML-KEM-768', '-out', kFile])
    }, BENCHMARK_REPEATS)
  }
  if (entry.tool === 'hqc') return measureMedianMs(() => hqcToolExec(['keygen', entry.variant]), BENCHMARK_REPEATS)
  if (entry.tool === 'sig') return measureMedianMs(() => sigToolExec(['keygen', entry.variant]), BENCHMARK_REPEATS)
  const file = path.join(dir, 'key.pem')
  return measureMedianMs(
    () => opensslExec(['genpkey', '-algorithm', entry.algorithm, ...(entry.extraOpts || []), '-out', file]),
    BENCHMARK_REPEATS,
  )
}

async function measureCatalogEncapDecapMs(entry, dir) {
  if (entry.hybridExchange) {
    const aliceX = path.join(dir, 'alice-x.pem')
    const alicePub = path.join(dir, 'alice-x-pub.pem')
    const bobX = path.join(dir, 'bob-x.pem')
    const bobPub = path.join(dir, 'bob-x-pub.pem')
    await opensslExec(['genpkey', '-algorithm', 'X25519', '-out', aliceX])
    await opensslExec(['pkey', '-in', aliceX, '-pubout', '-out', alicePub])
    await opensslExec(['genpkey', '-algorithm', 'X25519', '-out', bobX])
    await opensslExec(['pkey', '-in', bobX, '-pubout', '-out', bobPub])
    const mlkemKey = path.join(dir, 'mlkem.pem')
    const mlkemPub = path.join(dir, 'mlkem-pub.pem')
    await opensslExec(['genpkey', '-algorithm', 'ML-KEM-768', '-out', mlkemKey])
    await opensslExec(['pkey', '-in', mlkemKey, '-pubout', '-out', mlkemPub])
    const secretFile = path.join(dir, 'secret.bin')
    const ctFile = path.join(dir, 'ct.bin')
    const kemSecretFile = path.join(dir, 'kem-secret.bin')
    return measureMedianMs(async () => {
      await opensslExec(['pkeyutl', '-derive', '-inkey', aliceX, '-peerkey', bobPub, '-out', secretFile])
      await opensslExec(['pkeyutl', '-encap', '-inkey', mlkemPub, '-pubin', '-out', ctFile, '-secret', kemSecretFile])
      await opensslExec(['pkeyutl', '-decap', '-inkey', mlkemKey, '-in', ctFile, '-secret', kemSecretFile])
    }, BENCHMARK_REPEATS)
  }
  if (entry.tool === 'hqc') {
    const keypair = JSON.parse((await hqcToolExec(['keygen', entry.variant])).stdout)
    return measureMedianMs(async () => {
      const encapped = JSON.parse((await hqcToolExec(['encap', entry.variant, keypair.publicKeyHex])).stdout)
      await hqcToolExec(['decap', entry.variant, keypair.privateKeyHex, encapped.ciphertextHex])
    }, BENCHMARK_REPEATS)
  }
  const keyFile = path.join(dir, 'key.pem')
  const pubFile = path.join(dir, 'pub.pem')
  await opensslExec(['genpkey', '-algorithm', entry.algorithm, '-out', keyFile])
  await opensslExec(['pkey', '-in', keyFile, '-pubout', '-out', pubFile])
  const ctFile = path.join(dir, 'ct.bin')
  const secretFile = path.join(dir, 'secret.bin')
  return measureMedianMs(async () => {
    await opensslExec(['pkeyutl', '-encap', '-inkey', pubFile, '-pubin', '-out', ctFile, '-secret', secretFile])
    await opensslExec(['pkeyutl', '-decap', '-inkey', keyFile, '-in', ctFile, '-secret', secretFile])
  }, BENCHMARK_REPEATS)
}

async function measureCatalogSignMs(entry, dir) {
  const msgFile = path.join(dir, 'msg.txt')
  await writeFile(msgFile, 'Hello, post-quantum world!')
  if (entry.tool === 'sig') {
    const keypair = JSON.parse((await sigToolExec(['keygen', entry.variant])).stdout)
    const runner = () => sigToolExec(['sign', entry.variant, keypair.privateKeyHex, 'Hello, post-quantum world!'])
    return entry.slow ? measureMs(runner) : measureMedianMs(runner, BENCHMARK_REPEATS)
  }
  const keyFile = path.join(dir, 'key.pem')
  const sigFile = path.join(dir, 'sig.bin')
  if (entry.rsaPss) {
    await opensslExec(['genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', keyFile])
    const runner = () =>
      opensslExec([
        'pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-digest', 'sha256',
        '-pkeyopt', 'rsa_padding_mode:pss', '-in', msgFile, '-out', sigFile,
      ])
    return entry.slow ? measureMs(runner) : measureMedianMs(runner, BENCHMARK_REPEATS)
  }
  await opensslExec(['genpkey', '-algorithm', entry.algorithm, '-out', keyFile])
  const runner = () =>
    opensslExec(['pkeyutl', '-sign', '-inkey', keyFile, '-rawin', '-in', msgFile, '-out', sigFile])
  return entry.slow ? measureMs(runner) : measureMedianMs(runner, BENCHMARK_REPEATS)
}

async function measureBenchmark(catalog, measureFn, ids) {
  const dir = await mkdtemp(path.join(tmpdir(), 'benchmark-'))
  try {
    const results = []
    for (const id of ids) {
      const entry = catalog.find((e) => e.id === id)
      if (!entry) continue
      results.push({ label: entry.label, ms: await measureFn(entry, dir) })
    }
    return { results }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function measureKeygenBenchmark(ids) {
  return measureBenchmark(BENCHMARK_KEYGEN_CATALOG, measureCatalogKeygenMs, ids)
}

function measureEncapDecapBenchmark(ids) {
  return measureBenchmark(BENCHMARK_ENCAP_DECAP_CATALOG, measureCatalogEncapDecapMs, ids)
}

function measureSignVerifyBenchmark(ids) {
  return measureBenchmark(BENCHMARK_SIGN_VERIFY_CATALOG, measureCatalogSignMs, ids)
}

const TLS_HANDSHAKE_REPEATS = 5

// There's no single OpenSSL call for "time a full TLS connection" with
// a chosen group and signature algorithm, so this runs a genuine
// ephemeral TLS 1.3 server (openssl s_server) locally, then times real
// openssl s_client handshakes against it. The server's own stdin has
// to be explicitly ignored (`stdio: ['ignore', ...]`) - left as
// Node's default open, never-written pipe, s_server's select() loop
// never services the socket at all and every handshake hangs until
// the client times out, discovered the hard way while building this.
function timeTlsProfile(profile) {
  return (async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'tls-bench-'))
    let serverProc
    try {
      const keyFile = path.join(dir, 'key.pem')
      const certFile = path.join(dir, 'cert.pem')
      await opensslExec(['genpkey', '-algorithm', profile.sigAlgorithm, ...(profile.extraKeyOpts || []), '-out', keyFile])
      await opensslExec(['req', '-x509', '-new', '-key', keyFile, '-out', certFile, '-days', '1', '-subj', '/CN=localhost'])

      const port = 40000 + Math.floor(Math.random() * 20000)
      serverProc = spawn(OPENSSL_BIN, [
        's_server', '-cert', certFile, '-key', keyFile, '-groups', profile.group,
        '-tls1_3', '-accept', String(port), '-quiet',
      ], { env: { ...process.env, LD_LIBRARY_PATH: OPENSSL_LIB_PATH }, stdio: ['ignore', 'pipe', 'pipe'] })
      serverProc.stdout.on('data', () => {})
      serverProc.stderr.on('data', () => {})
      await new Promise((resolve) => setTimeout(resolve, 600))

      const oneHandshake = () =>
        new Promise((resolve, reject) => {
          const t0 = performance.now()
          const client = spawn(OPENSSL_BIN, [
            's_client', '-connect', `127.0.0.1:${port}`, '-groups', profile.group, '-tls1_3', '-quiet',
          ], { env: { ...process.env, LD_LIBRARY_PATH: OPENSSL_LIB_PATH } })
          client.stdout.on('data', () => {})
          client.stderr.on('data', () => {})
          client.stdin.end()
          client.on('close', (code) => {
            if (code === 0) resolve(performance.now() - t0)
            else reject(new Error(`handshake failed (exit ${code})`))
          })
          client.on('error', reject)
          setTimeout(() => {
            client.kill()
            reject(new Error('handshake timed out'))
          }, 5000)
        })

      const durations = []
      for (let i = 0; i < TLS_HANDSHAKE_REPEATS; i++) durations.push(await oneHandshake())
      durations.sort((a, b) => a - b)
      return durations[Math.floor(durations.length / 2)]
    } finally {
      if (serverProc) serverProc.kill()
      await rm(dir, { recursive: true, force: true })
    }
  })()
}

async function measureTlsBenchmark(ids) {
  const results = []
  for (const id of ids) {
    const profile = BENCHMARK_TLS_CATALOG.find((p) => p.id === id)
    if (!profile) continue
    results.push({ label: profile.label, ms: await timeTlsProfile(profile) })
  }
  return { results }
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

  if (route === '/benchmark/keygen') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, measureKeygenBenchmark(Array.isArray(body.ids) ? body.ids : []))
    return
  }

  if (route === '/benchmark/encap-decap') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, measureEncapDecapBenchmark(Array.isArray(body.ids) ? body.ids : []))
    return
  }

  if (route === '/benchmark/sign-verify') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, measureSignVerifyBenchmark(Array.isArray(body.ids) ? body.ids : []))
    return
  }

  if (route === '/benchmark/tls') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, measureTlsBenchmark(Array.isArray(body.ids) ? body.ids : []))
    return
  }

  if (route === '/hybrid/exchange') {
    respond(res, hybridExchange())
    return
  }

  if (route === '/hqc/keygen') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, generateHqcKeypair(body.variant))
    return
  }

  if (route === '/hqc/encap-decap') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, hqcEncapDecap(body.variant))
    return
  }

  if (route === '/hqc/speed') {
    respond(res, measureHqcVsKemSpeed())
    return
  }

  if (route === '/frodokem/keygen') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, generateFrodoKemKeypair(body.variant))
    return
  }

  if (route === '/frodokem/encap-decap') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, frodoKemEncapDecap(body.variant))
    return
  }

  if (route === '/frodokem/speed') {
    respond(res, measureFrodoKemVsKemSpeed())
    return
  }

  if (route === '/fn-dsa/sign') {
    const body = await readJsonBody(req).catch(() => ({}))
    respond(res, signAndVerifyFnDsa(body.variant, body.message))
    return
  }

  if (route === '/fn-dsa/speed') {
    respond(res, measureFnDsaSpeed())
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
