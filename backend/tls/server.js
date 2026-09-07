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

// The system openssl (3.0.20) has no ML-KEM/hybrid group support at
// all - checking those needs the same separately-built OpenSSL 3.5.8
// the pqc/ service already uses (OPENSSL_BIN/OPENSSL_LIB_PATH, same
// defaults). Every check below runs through this one build for
// consistency, not just the PQC-group ones.
const OPENSSL_BIN = process.env.OPENSSL_BIN || '/usr/local/ssl/bin/openssl'
const OPENSSL_LIB_PATH = process.env.OPENSSL_LIB_PATH || '/usr/local/ssl/lib'

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
const CIPHER_CHECKS = [
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

// The asymmetric side: exactly the four key-exchange options this
// chapter's own ClientHello step names. Forcing a single named group
// (rather than letting the client offer several) means a successful
// handshake proves the server genuinely accepted that specific group,
// same logic as the cipher checks above. All forced to TLS 1.3, since
// that's the only version the ML-KEM/hybrid groups exist in at all.
const GROUP_CHECKS = [
  { id: 'p256', label: 'ECC P-256', args: ['-tls1_3', '-groups', 'secp256r1'] },
  { id: 'x25519', label: 'X25519', args: ['-tls1_3', '-groups', 'x25519'] },
  { id: 'mlkem768', label: 'ML-KEM-768', args: ['-tls1_3', '-groups', 'MLKEM768'] },
  {
    id: 'hybrid',
    label: 'X25519 + ML-KEM-768 (hybrid)',
    args: ['-tls1_3', '-groups', 'X25519MLKEM768'],
  },
]

function runOpensslCheck(args) {
  return new Promise((resolve) => {
    const child = spawn(OPENSSL_BIN, [
      's_client', '-connect', TARGET_ADDR, '-servername', TARGET_HOST,
      ...args, '-brief',
    ], { env: { ...process.env, LD_LIBRARY_PATH: OPENSSL_LIB_PATH } })
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
      const groupMatch = out.match(/Peer Temp Key:\s*(.+)/)
      if (protocolMatch && cipherMatch) {
        resolve({
          supported: true,
          protocol: protocolMatch[1],
          cipher: cipherMatch[1],
          ...(groupMatch ? { group: groupMatch[1].trim() } : {}),
        })
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

async function runChecks(catalog) {
  const results = []
  for (const check of catalog) {
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
      const serverChecks = await runChecks(CIPHER_CHECKS)
      const groupChecks = await runChecks(GROUP_CHECKS)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ yourConnection, serverChecks, groupChecks }))
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
