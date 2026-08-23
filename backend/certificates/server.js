import { execFile as execFileCb } from 'node:child_process'
import crypto from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import tls from 'node:tls'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8100
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/bin/openssl'
const TIMEOUT_MS = 10_000

// Both sites this app is actually deployed on - not an open proxy for
// fetching arbitrary hosts' certificates.
const ALLOWED_HOSTS = ['cryptomaths.org', 'wikiclass.org']

// openssl's -subj format uses "/" to separate RDNs and "=" within each one,
// so both need stripping from user input rather than just shell-escaping -
// execFile already passes args as an array, never through a shell.
function sanitizeSubjectField(value, fallback) {
  if (typeof value !== 'string') return fallback
  const cleaned = value.replace(/[/\\=\r\n]/g, '').trim().slice(0, 64)
  return cleaned || fallback
}

async function generateCertificate(commonName, organisation) {
  const cn = sanitizeSubjectField(commonName, 'Alice')
  const o = sanitizeSubjectField(organisation, 'CryptoMaths Demo')
  const dir = await mkdtemp(path.join(tmpdir(), 'cert-'))
  const keyFile = path.join(dir, 'key.pem')
  const certFile = path.join(dir, 'cert.pem')
  try {
    await execFile(
      OPENSSL_BIN,
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-days',
        '365',
        '-nodes',
        '-keyout',
        keyFile,
        '-out',
        certFile,
        '-subj',
        `/CN=${cn}/O=${o}`,
      ],
      { timeout: TIMEOUT_MS },
    )
    const certPem = await readFile(certFile, 'utf8')
    return { certPem, commonName: cn, organisation: o }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// A real TLS handshake against the live site, not a canned example - the
// certificate this returns is whatever's actually deployed right now.
function fetchPeerCertificateDer(host) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, timeout: TIMEOUT_MS },
      () => {
        const cert = socket.getPeerCertificate(false)
        socket.end()
        if (!cert || !cert.raw) {
          reject(new Error('no certificate received'))
          return
        }
        resolve(cert.raw)
      },
    )
    socket.on('error', reject)
    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('connection timed out'))
    })
  })
}

async function fetchAndDecodeCertificate(host) {
  if (!ALLOWED_HOSTS.includes(host)) {
    throw new Error(`host must be one of ${ALLOWED_HOSTS.join(', ')}`)
  }
  const der = await fetchPeerCertificateDer(host)
  const certPem = new crypto.X509Certificate(der).toString()
  const dir = await mkdtemp(path.join(tmpdir(), 'cert-fetch-'))
  const certFile = path.join(dir, 'cert.pem')
  try {
    await writeFile(certFile, certPem)
    const { stdout: decodedText } = await execFile(
      OPENSSL_BIN,
      ['x509', '-in', certFile, '-noout', '-text'],
      { timeout: TIMEOUT_MS },
    )
    return { host, certPem, decodedText }
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

  if (route === '/fetch-live') {
    try {
      const body = await readJsonBody(req)
      const result = await fetchAndDecodeCertificate(body.host)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (route !== '/generate') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  try {
    const body = await readJsonBody(req)
    const result = await generateCertificate(body.commonName, body.organisation)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`certificates backend listening on 127.0.0.1:${PORT}`)
})
