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
