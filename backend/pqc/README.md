# pqc

Powers the live demos on the Post-Quantum Cryptography chapter's
algorithm pages (ML-KEM, ML-DSA, SLH-DSA). Wraps a real `openssl` CLI
directly, same as every other service in this repo.

```
POST /ml-kem/keygen       { variant }        -> { variant, publicPem, privatePem }
POST /ml-kem/encap-decap  { variant }        -> { variant, publicPem, ciphertextHex, ciphertextBytes, bobSecretHex, aliceSecretHex, matched }
POST /ml-kem/speed                          -> { results: [{ label, ms }] }
POST /ml-dsa/sign    { variant, message }   -> { variant, publicPem, message, signatureHex, signatureBytes, verified }
POST /ml-dsa/speed                          -> { results: [{ label, ms }] }
POST /slh-dsa/sign   { variant, message }   -> same shape as /ml-dsa/sign
POST /slh-dsa/speed                         -> { results: [{ label, ms }] }
```

`variant` is checked against an explicit allowlist per algorithm:
`ML-KEM-512/768/1024`, `ML-DSA-44/65/87`, and six SLH-DSA SHAKE
parameter sets (`128s/128f/192s/192f/256s/256f`).

## Why this needs its own openssl

Debian 12's system `openssl` is 3.0.20, which predates NIST's PQC
standards entirely (ML-KEM/ML-DSA/SLH-DSA landed in OpenSSL 3.5.0,
April 2025). Rather than upgrading the system openssl every other
service on this box links against, this points at a separately built
OpenSSL 3.5.8 already present at `/usr/local/ssl/` from earlier
dissertation work, via `OPENSSL_BIN` and `OPENSSL_LIB_PATH` (the build
isn't on the system library path, so every invocation runs with
`LD_LIBRARY_PATH` set explicitly).

## Run

```bash
node server.js   # listens on 127.0.0.1:8101 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/pqc/` - see the repo's `DEPLOY.md`.

## Safety notes

`TIMEOUT_MS` is 20s per openssl invocation - generous next to the
slowest real operation observed (SLH-DSA-SHAKE-256s signing, ~4s on
the production Pi 4B), not a real constraint. `variant` and `message`
(capped at 500 characters) are the only user input, and both are
validated/sanitised before use. All OpenSSL invocations use `execFile`
with an argument array, never a shell string.
