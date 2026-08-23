import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8099
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/bin/openssl'
const TIMEOUT_MS = 10_000

// Matches the curve comparison table on the Curves in Practice page.
// X25519 is a different OpenSSL key type from the traditional NIST/SECG
// curves (genpkey -algorithm X25519, not ecparam), so each entry carries
// its own keygen args rather than assuming one shape fits all.
const CURVES = {
  'P-256': { keygenArgs: ['ecparam', '-name', 'prime256v1', '-genkey', '-noout'] },
  'P-384': { keygenArgs: ['ecparam', '-name', 'secp384r1', '-genkey', '-noout'] },
  'P-521': { keygenArgs: ['ecparam', '-name', 'secp521r1', '-genkey', '-noout'] },
  'Curve25519': { keygenArgs: ['genpkey', '-algorithm', 'X25519'] },
  'secp256k1': { keygenArgs: ['ecparam', '-name', 'secp256k1', '-genkey', '-noout'] },
}

async function generateKey(curveName) {
  const config = CURVES[curveName]
  const dir = await mkdtemp(path.join(tmpdir(), 'ecdh-'))
  const keyFile = path.join(dir, 'key.pem')
  try {
    await execFile(OPENSSL_BIN, [...config.keygenArgs, '-out', keyFile], {
      timeout: TIMEOUT_MS,
    })
    const privatePem = await readFile(keyFile, 'utf8')
    const { stdout: publicPem } = await execFile(
      OPENSSL_BIN,
      ['pkey', '-in', keyFile, '-pubout'],
      { timeout: TIMEOUT_MS },
    )
    return { curve: curveName, privatePem, publicPem }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Generates a real key on every curve, for side-by-side size comparison.
async function generateAllKeys() {
  const results = []
  for (const curveName of Object.keys(CURVES)) {
    const { publicPem, privatePem } = await generateKey(curveName)
    results.push({ curve: curveName, publicPem, privatePem })
  }
  return results
}

// Keygen timing across all five curves. Real, consistent differences
// (benchmarked on the production Pi: P-256 ~13ms, secp256k1 ~16ms,
// P-384 ~20ms, P-521 ~31ms, X25519 ~13ms) that scale with curve size -
// small next to RSA's ~1-1.5s elsewhere on this site, but not just noise.
async function measureCurveSpeed() {
  const results = []
  for (const [curveName, config] of Object.entries(CURVES)) {
    const ms = await measureMs(config.keygenArgs)
    results.push({ curve: curveName, ms })
  }
  return results
}

// RFC 7919's standard groups - the ones real DH implementations actually
// reuse (see measureKeyExchangeSpeed below for why generating a fresh one
// isn't practical). Named for their prime's bit length, same convention
// as the curves above.
const DH_GROUPS = ['ffdhe2048', 'ffdhe3072', 'ffdhe4096']

async function generateDhKey(group) {
  const dir = await mkdtemp(path.join(tmpdir(), 'dh-'))
  const keyFile = path.join(dir, 'key.pem')
  try {
    await execFile(
      OPENSSL_BIN,
      ['genpkey', '-algorithm', 'DH', '-pkeyopt', `group:${group}`, '-out', keyFile],
      { timeout: TIMEOUT_MS },
    )
    const privatePem = await readFile(keyFile, 'utf8')
    const { stdout: publicPem } = await execFile(
      OPENSSL_BIN,
      ['pkey', '-in', keyFile, '-pubout'],
      { timeout: TIMEOUT_MS },
    )
    return { group, privatePem, publicPem }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// Classic Diffie-Hellman keygen, two ways. Real TLS almost always reuses
// a standard, pre-shared group (RFC 7919's ffdhe2048 here) rather than
// generating its own - that's fast, since it skips the actual expensive
// part: finding a safe prime. Rolling your own parameters (recommended
// practice after 2015's Logjam attack, since a small number of widely-
// shared groups are a juicier attack target) means paying that safe-
// prime search cost directly, which is where classic DH's real slowness
// comes from - not the exchange itself. 512-bit here purely to keep a
// live demo's wait time bounded (benchmarked empirically: consistently
// well under a second at this size, versus multi-second and highly
// variable already at 1024-bit) - never a size anyone would actually use.
async function measureMs(args) {
  const t0 = performance.now()
  await execFile(OPENSSL_BIN, args, { timeout: TIMEOUT_MS })
  return performance.now() - t0
}

async function measureKeyExchangeSpeed() {
  const dhSharedGroupMs = await measureMs([
    'genpkey',
    '-algorithm',
    'DH',
    '-pkeyopt',
    'group:ffdhe2048',
  ])
  const dhFreshParamsMs = await measureMs(['dhparam', '512'])
  const ecdhMs = await measureMs([
    'ecparam',
    '-name',
    'prime256v1',
    '-genkey',
    '-noout',
  ])
  return {
    dhSharedGroup: { label: 'DH, shared group (ffdhe2048)', ms: dhSharedGroupMs },
    dhFreshParams: {
      label: 'DH, generating its own 512-bit parameters',
      ms: dhFreshParamsMs,
    },
    ecdh: { label: 'ECDH (P-256)', ms: ecdhMs },
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

const server = http.createServer(async (req, res) => {
  const route = req.method === 'POST' ? req.url : null

  if (route === '/keygen-all') {
    try {
      const result = await generateAllKeys()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results: result }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route === '/curve-speed') {
    try {
      const result = await measureCurveSpeed()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results: result }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route === '/dh-keygen') {
    try {
      const body = await readJsonBody(req)
      if (!DH_GROUPS.includes(body.group)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({ error: `group must be one of ${DH_GROUPS.join(', ')}` }),
        )
        return
      }
      const result = await generateDhKey(body.group)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route === '/dh-speed') {
    try {
      const result = await measureKeyExchangeSpeed()
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
    if (!Object.hasOwn(CURVES, body.curve)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: `curve must be one of ${Object.keys(CURVES).join(', ')}`,
        }),
      )
      return
    }
    const result = await generateKey(body.curve)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ecdh backend listening on 127.0.0.1:${PORT}`)
})
