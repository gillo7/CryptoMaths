import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCb)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 8095
const MD5COLLGEN_BIN =
  process.env.MD5COLLGEN_BIN ||
  path.join(__dirname, 'vendor/md5collgen/md5collgen')
// Observed 0.5-7.4s across test runs, with one outlier over 20s - the
// birthday-search has real variance in its tail. Generous timeout so rare
// slow runs still succeed instead of failing the request.
const TIMEOUT_MS = 45_000
const MAX_PREFIX_BYTES = 200

// Generates a real MD5 collision using md5collgen (Marc Stevens' fastcoll
// algorithm). Runs in an isolated temp dir, invoked via execFile with a
// fixed argument array (never a shell string), so there's no user input
// anywhere near this command - a chosen prefix goes into a file that
// md5collgen reads, never into the command line or a shell.
async function runMd5Collgen(prefix) {
  const dir = await mkdtemp(path.join(tmpdir(), 'md5coll-'))
  const out1 = path.join(dir, 'msg1.bin')
  const out2 = path.join(dir, 'msg2.bin')
  try {
    const args = ['-q']
    if (prefix) {
      const prefixFile = path.join(dir, 'prefix.bin')
      await writeFile(prefixFile, prefix, 'utf8')
      args.push('-p', prefixFile)
    }
    args.push('-o', out1, out2)

    await execFile(MD5COLLGEN_BIN, args, { timeout: TIMEOUT_MS })
    const [msg1, msg2] = await Promise.all([readFile(out1), readFile(out2)])
    return { msg1: msg1.toString('hex'), msg2: msg2.toString('hex') }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// md5collgen is CPU-heavy (observed 0.5-7s per run), so only one search
// runs at a time regardless of how many requests arrive concurrently.
let queue = Promise.resolve()

function enqueue(prefix) {
  const job = queue.then(() => runMd5Collgen(prefix), () => runMd5Collgen(prefix))
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
    if (size > 4096) throw new Error('body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/md5-collision') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  let prefix
  try {
    const body = await readJsonBody(req)
    if (body.prefix !== undefined) {
      if (typeof body.prefix !== 'string') {
        throw new Error('prefix must be a string')
      }
      if (Buffer.byteLength(body.prefix, 'utf8') > MAX_PREFIX_BYTES) {
        throw new Error('prefix too long')
      }
      prefix = body.prefix
    }
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err.message }))
    return
  }

  try {
    const result = await enqueue(prefix)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  } catch {
    res.writeHead(504, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'collision generation failed or timed out' }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`md5-collision backend listening on 127.0.0.1:${PORT}`)
})
