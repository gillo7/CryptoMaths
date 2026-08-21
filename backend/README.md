# CryptoMaths backend

Most of CryptoMaths is a fully static frontend (see `../frontend/`) - no
backend needed. This folder is the exception: a handful of standalone
services for the few demos that genuinely need to run a real external
tool server-side (not something that can run in the browser).

Each demo gets its **own subfolder** and its own `package.json` - no
shared framework, no monorepo tooling. Most run as one small process per
distinct tool being wrapped; the exceptions are `openssl/` and `rsa/`,
each one service with multiple endpoints, since every endpoint within
one of those is really the same "safely shell out to OpenSSL" operation
with different parameters, not a distinct tool.

## Services

| Folder | Endpoint (via nginx) | Port | What it does |
| --- | --- | --- | --- |
| [md5-collision/](md5-collision/) | `/api/hashing/md5-collision` | 8095 | Generates a live MD5 collision via Marc Stevens' `fastcoll` |
| [lm-cracker/](lm-cracker/) | `/api/hashing/lm-crack` | 8096 | Cracks a submitted LM hash via John the Ripper |
| [openssl/](openssl/) | `/api/openssl/{enc,dec,benchmark,benchmark-all}` | 8097 | Cipher/decipher demos for Symmetric Encryption (and later PQC) via real `openssl` |
| [rsa/](rsa/) | `/api/rsa/keygen` | 8098 | RSA demos for Public Key Encryption via real `openssl` |

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
