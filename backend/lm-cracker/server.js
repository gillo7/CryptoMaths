import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)

const PORT = process.env.PORT || 8096
const JOHN_BIN = process.env.JOHN_BIN || '/usr/sbin/john'
const INCREMENTAL_MODE = 'CryptoMathsLM'
const LM_HASH_PATTERN = /^[0-9a-fA-F]{32}$/
// Worst-case observed on the production Pi 4 B: ~4.9s to exhaustively
// search the full MaxLen=5 keyspace with no match. Generous margin.
const CRACK_TIMEOUT_MS = 30_000

// Cracks an LM hash using John the Ripper, restricted to a bounded
// incremental mode (A-Z0-9, 1-5 chars - see setup.sh) so the demo stays
// fast regardless of what's actually submitted. The client only ever
// sends the hash, never a plaintext password - this mirrors a real
// attacker who has stolen a hash dump and nothing else.
async function crackLmHash(lmHash) {
  const dir = await mkdtemp(path.join(tmpdir(), 'lmcrack-'))
  const hashFile = path.join(dir, 'hashes.txt')
  try {
    await writeFile(hashFile, `demo:1000:${lmHash}:0:::\n`, 'utf8')

    const start = performance.now()
    await execFile(
      JOHN_BIN,
      [
        '--format=LM',
        `--incremental=${INCREMENTAL_MODE}`,
        '--session=job',
        hashFile,
      ],
      { cwd: dir, timeout: CRACK_TIMEOUT_MS },
    )
    const elapsedMs = Math.round(performance.now() - start)

    const { stdout } = await execFile(
      JOHN_BIN,
      ['--show', '--format=LM', hashFile],
      { cwd: dir, timeout: CRACK_TIMEOUT_MS },
    )

    // --show prints "user:password:uid:hash:::" per cracked entry - only
    // present at all if this specific hash was actually cracked.
    const line = stdout.split('\n').find((l) => l.startsWith('demo:'))
    if (!line) return { cracked: false, elapsedMs }
    return { cracked: true, password: line.split(':')[1], elapsedMs }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// John shares a single pot/session state, so only one crack runs at a
// time regardless of how many requests arrive concurrently.
let queue = Promise.resolve()

function enqueue(lmHash) {
  const job = queue.then(
    () => crackLmHash(lmHash),
    () => crackLmHash(lmHash),
  )
  queue = job.then(
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
    if (size > 1024) throw new Error('body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/crack-lm') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  let lmHash
  try {
    const body = await readJsonBody(req)
    if (typeof body.lmHash !== 'string' || !LM_HASH_PATTERN.test(body.lmHash)) {
      throw new Error('lmHash must be a 32-character hex string')
    }
    lmHash = body.lmHash.toLowerCase()
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
    return
  }

  try {
    const result = await enqueue(lmHash)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch {
    res.writeHead(504, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'cracking failed or timed out' }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`lm-cracker backend listening on 127.0.0.1:${PORT}`)
})
