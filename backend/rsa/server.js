import { execFile as execFileCb } from 'node:child_process'
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
