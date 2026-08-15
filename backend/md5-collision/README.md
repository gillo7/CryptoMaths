# md5-collision

Powers the live MD5 collision demo on the Hashing lesson's MD5 page. One
endpoint, no dependencies:

```
POST /md5-collision  ->  { msg1: "<256 hex chars>", msg2: "<256 hex chars>" }
```

`msg1` and `msg2` are two different 128-byte messages that hash to the same
MD5 digest. The frontend hashes both itself (via `hash-wasm`, the same
library used everywhere else on the site) to prove the collision live,
rather than trusting the value straight off the wire.

## Credit

Collision generation is done by [`md5collgen`](https://github.com/zhijieshi/md5collgen),
a build of **Marc Stevens'** `fastcoll` algorithm from his
[HashClash](https://github.com/cr-marcstevens/hashclash) project. All of
the actual cryptanalysis is his work — this service just shells out to
his tool and serves the result. This credit is also shown directly on the
MD5 page itself, next to the demo.

See Stevens, "On Collisions for Hash Functions MD4, MD5, HAVAL-128 and
RIPEMD" (2007) for the underlying research.

## Setup (once, on the server)

```bash
./setup.sh   # clones and builds md5collgen into vendor/ (gitignored)
```

## Run

```bash
node server.js   # listens on 127.0.0.1:8095 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/hashing/md5-collision` — see the repo's `DEPLOY.md`.

## Safety notes

`md5collgen` is CPU-heavy (observed 0.5-7s per run on the production
server, 4 cores). This service queues requests so only one search runs at
a time, and each run has a 20s timeout. Rate limiting per-IP is handled at
the nginx layer, not here.
