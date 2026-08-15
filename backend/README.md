# CryptoMaths backend

Most of CryptoMaths is a fully static frontend (see `../frontend/`) — no
backend needed. This folder is the exception: a handful of standalone
services for the few demos that genuinely need to run a real external
tool server-side (not something that can run in the browser).

Each demo gets its **own subfolder**, its own `package.json`, and runs as
its own small process — no shared framework, no monorepo tooling. Keep
each one boring and self-contained; that's the point.

## Services

| Folder | Endpoint (via nginx) | Port | What it does |
| --- | --- | --- | --- |
| [md5-collision/](md5-collision/) | `/api/hashing/md5-collision` | 8095 | Generates a live MD5 collision via Marc Stevens' `fastcoll` |

When adding a new service: pick the next free port in the 809x range,
add a row above, give it its own `location /api/<name>/` block in the
server's nginx config (see `../DEPLOY.md`), and put safety notes (timeouts,
rate limits, anything CPU/resource-heavy) in that service's own README.

## Running a service

```bash
cd <service>/
./setup.sh    # if present - builds/vendors any external tool needed
node server.js
```
