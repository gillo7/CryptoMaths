import { spawn } from 'node:child_process'
import http from 'node:http'

const PORT = process.env.PORT || 8102
const TARGET_HOST = process.env.TARGET_HOST || 'cryptomaths.org'
// Connects to nginx over loopback rather than out over the internet to
// itself - same real external TLS listener nginx terminates for every
// visitor, just without depending on this box's own DNS/routing back to
// its own public IP. -servername still sends the real hostname via SNI,
// so nginx picks the same certificate/config it would for a real client.
const TARGET_ADDR = process.env.TARGET_ADDR || '127.0.0.1:443'
const TIMEOUT_MS = 8_000

// Every check nginx's own listener is actually asked to answer, live,
// each time this endpoint is called - nothing here is precomputed or
// hardcoded from a past run. TLS 1.0/1.1 are expected to be rejected
// outright (no protocols available) since certbot's modern nginx config
// only offers 1.2/1.3; the legacy-cipher check is expected to be
// rejected too (a real CBC/SHA1 suite the server's cipher list excludes,
// not a made-up name), the modern one accepted - both ECDSA suites,
// deliberately avoiding any ECDHE-RSA-* names, which would fail here
// for an unrelated reason (this server's certificate is ECDSA, not
// RSA, so no RSA-keyexchange suite could work regardless of policy).
const CHECKS = [
  { id: 'tls1', label: 'TLS 1.0', args: ['-tls1'] },
  { id: 'tls1_1', label: 'TLS 1.1', args: ['-tls1_1'] },
  { id: 'tls1_2', label: 'TLS 1.2', args: ['-tls1_2'] },
  {
    id: 'tls1_2_legacy_cipher',
    label: 'TLS 1.2 - legacy cipher (ECDHE-ECDSA-AES128-SHA, CBC + SHA-1)',
    args: ['-tls1_2', '-cipher', 'ECDHE-ECDSA-AES128-SHA'],
  },
  {
    id: 'tls1_2_modern_cipher',
    label: 'TLS 1.2 - modern cipher (ECDHE-ECDSA-CHACHA20-POLY1305)',
    args: ['-tls1_2', '-cipher', 'ECDHE-ECDSA-CHACHA20-POLY1305'],
  },
  { id: 'tls1_3', label: 'TLS 1.3', args: ['-tls1_3'] },
]

function runOpensslCheck(args) {
  return new Promise((resolve) => {
    const child = spawn('openssl', [
      's_client', '-connect', TARGET_ADDR, '-servername', TARGET_HOST,
      ...args, '-brief',
    ])
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.stdin.end()
    const timer = setTimeout(() => {
      child.kill()
      resolve({ supported: false })
    }, TIMEOUT_MS)
    child.on('close', () => {
      clearTimeout(timer)
      const protocolMatch = out.match(/Protocol version:\s*(\S+)/)
      const cipherMatch = out.match(/Ciphersuite:\s*(\S+)/)
      if (protocolMatch && cipherMatch) {
        resolve({ supported: true, protocol: protocolMatch[1], cipher: cipherMatch[1] })
      } else {
        resolve({ supported: false })
      }
    })
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ supported: false })
    })
  })
}

async function scanServer() {
  const results = []
  for (const check of CHECKS) {
    const outcome = await runOpensslCheck(check.args)
    results.push({ id: check.id, label: check.label, ...outcome })
  }
  return results
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/scan') {
    try {
      // nginx forwards the ACTUAL negotiated protocol/cipher for the
      // browser's own current HTTPS connection to this site via these
      // two headers ($ssl_protocol/$ssl_cipher, set in its own config) -
      // this is a real, live property of the request that is arriving
      // right now, not something this service can fabricate or cache.
      const yourConnection = {
        protocol: req.headers['x-client-tls-protocol'] || null,
        cipher: req.headers['x-client-tls-cipher'] || null,
      }
      const serverChecks = await scanServer()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ yourConnection, serverChecks }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`tls backend listening on 127.0.0.1:${PORT}`)
})
