# CryptoMaths backend

Most of CryptoMaths is a fully static frontend (see `../frontend/`) - no
backend needed. This folder is the exception: a handful of standalone
services for the few demos that genuinely need to run a real external
tool server-side (not something that can run in the browser).

Each demo gets its **own subfolder** and its own `package.json` - no
shared framework, no monorepo tooling. Most run as one small process per
distinct tool being wrapped; the exceptions are `openssl/`, `rsa/`, and
`ecdh/`, each one service with multiple endpoints, since every endpoint
within one of those is really the same "safely shell out to OpenSSL"
operation with different parameters, not a distinct tool.

## Services

| Folder | Endpoint (via nginx) | Port | What it does |
| --- | --- | --- | --- |
| [md5-collision/](md5-collision/) | `/api/hashing/md5-collision` | 8095 | Generates a live MD5 collision via Marc Stevens' `fastcoll` |
| [lm-cracker/](lm-cracker/) | `/api/hashing/lm-crack` | 8096 | Cracks a submitted LM hash via John the Ripper |
| [openssl/](openssl/) | `/api/openssl/{enc,dec,benchmark,benchmark-all}` | 8097 | Cipher/decipher demos for Symmetric Encryption (and later PQC) via real `openssl` |
| [rsa/](rsa/) | `/api/rsa/{keygen,weak-keygen,break,speed}` | 8098 | RSA demos for Public Key Encryption via real `openssl` - keygen, the live RSA breaker, and the RSA-vs-ECDSA speed comparison |
| [ecdh/](ecdh/) | `/api/ecdh/{keygen,dh-keygen,dh-speed}` | 8099 | ECDH and classic DH demos for Key Exchange via real `openssl` |
| [certificates/](certificates/) | `/api/certificates/{generate,fetch-live,root-certs,crl-check}` | 8100 | Certificate generation, live TLS fetch/decode, root CA listing, and CRL revocation checks for Certificates via real `openssl` |
| [pqc/](pqc/) | `/api/pqc/{ml-kem,ml-dsa,slh-dsa,hqc,fn-dsa,frodokem}/{keygen,sign,speed,encap-decap}`, `/api/pqc/hybrid/exchange`, `/api/pqc/benchmark/{keygen,encap-decap,sign-verify,tls}` | 8101 | ML-KEM/ML-DSA/SLH-DSA keygen, sign/verify, and speed benchmarks via a separately built OpenSSL 3.5.8 (system openssl is 3.0.20, predates PQC support); HQC, FN-DSA (Falcon) and FrodoKEM via liboqs directly instead, since none of the three have OpenSSL support (HQC has no assigned OID yet, FN-DSA has no FIPS text yet, and FrodoKEM has no OpenSSL 3.5 support at all despite its 2026 ISO standardisation); `hybrid/exchange` runs a real X25519 + ML-KEM-768 combined exchange; `benchmark/*` is the hub page's cross-algorithm tool, letting the reader pick any mix of algorithms per operation, `benchmark/tls` uniquely spins up a genuine ephemeral local `openssl s_server`/`s_client` handshake rather than a single crypto call |

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
