# rsa

Powers the RSA demos across the Public Key Encryption lesson. One shared
service, multiple endpoints (as they get built out) - wraps the real
`openssl` CLI directly rather than reimplementing key generation or modular
arithmetic.

```
POST /keygen  { bits }  ->  { bits, pem, n, e, d, p, q }
```

`bits` must be `512`, `1024`, or `2048`. 512 is OpenSSL's own enforced
floor - the default provider rejects anything smaller with "key size too
small", not a limit chosen for this demo.

Runs `openssl genrsa` to generate a real key, then `openssl rsa -text` to
extract the actual `n` (modulus), `e` (public exponent), `d` (private
exponent), `p`, and `q` (the two primes) as hex strings - the same fields
a real RSA key is built from, just at a size small enough to display in
full rather than a real-world 2048+/4096-bit key's astronomically long
values.

## Run

```bash
node server.js   # listens on 127.0.0.1:8098 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/rsa/` - see the repo's `DEPLOY.md`.

## Safety notes

Key generation at these sizes is fast (2048-bit takes well under half a
second even on this site's Raspberry Pi), so no queueing or long timeout
is needed - `TIMEOUT_MS` is a generous 10s backstop, not a real
constraint. `bits` is checked against an explicit allowlist. All OpenSSL
invocations use `execFile` with an argument array, never a shell string.
