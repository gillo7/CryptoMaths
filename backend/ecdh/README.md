# ecdh

Powers the ECDH key generation demo on the Key Exchange lesson's ECDH
page. Wraps the real `openssl` CLI directly rather than reimplementing
key generation.

```
POST /keygen  { curve }  ->  { curve, privatePem, publicPem }
```

`curve` must be one of `P-256`, `P-384`, `P-521`, `Curve25519`, or
`secp256k1` - the same five curves covered in the Curves in Practice
table. The NIST/SECG curves (P-256/384/521, secp256k1) go through
`openssl ecparam -genkey`; Curve25519 is a different OpenSSL key type
entirely (`openssl genpkey -algorithm X25519`, not `ecparam`), so each
curve carries its own keygen args rather than assuming one shape fits
all. Public key extraction uses `openssl pkey -pubout`, which works
uniformly across both key types.

## Run

```bash
node server.js   # listens on 127.0.0.1:8099 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/ecdh/` - see the repo's `DEPLOY.md`.

## Safety notes

Key generation at these sizes is fast, so no queueing or long timeout is
needed - `TIMEOUT_MS` is a generous 10s backstop, not a real constraint.
`curve` is checked against an explicit allowlist. All OpenSSL
invocations use `execFile` with an argument array, never a shell string.
