# pqc

Powers the live demos on the Post-Quantum Cryptography chapter's
algorithm pages (ML-KEM, ML-DSA, SLH-DSA, HQC). Wraps a real `openssl`
CLI directly for the first three, same as every other service in this
repo; HQC needs a different approach entirely - see below.

```
POST /ml-kem/keygen       { variant }        -> { variant, publicPem, privatePem }
POST /ml-kem/encap-decap  { variant }        -> { variant, publicPem, ciphertextHex, ciphertextBytes, bobSecretHex, aliceSecretHex, matched }
POST /ml-kem/speed                          -> { results: [{ label, ms }] }
POST /ml-dsa/sign    { variant, message }   -> { variant, publicPem, message, signatureHex, signatureBytes, verified }
POST /ml-dsa/speed                          -> { results: [{ label, ms }] }
POST /slh-dsa/sign   { variant, message }   -> same shape as /ml-dsa/sign
POST /slh-dsa/speed                         -> { results: [{ label, ms }] }
POST /hqc/keygen      { variant }           -> { variant, publicKeyHex, privateKeyHex, publicKeyBytes, privateKeyBytes }
POST /hqc/encap-decap { variant }           -> { variant, publicKeyHex, publicKeyBytes, ciphertextHex, ciphertextBytes, bobSecretHex, aliceSecretHex, matched }
```

`variant` is checked against an explicit allowlist per algorithm:
`ML-KEM-512/768/1024`, `ML-DSA-44/65/87`, the nine SLH-DSA parameter
sets matching the dissertation's own `benchmark.py` selection -
`SHA2-128s/128f`, `SHAKE-128s`, `SHA2-192s/192f`, `SHAKE-192s`,
`SHA2-256s/256f`, `SHAKE-256s` (SHA2 gets both `s` and `f` at every
level, SHAKE only `s`) - and `HQC-128/192/256`.

## HQC: liboqs directly, not OpenSSL

HQC has no assigned OID yet (still pre-standardisation - NIST selected
it in March 2025, a final FIPS standard is targeted for 2027), and
OpenSSL's `oqs-provider` (built and tested while diagnosing this)
cannot serialise a key with no OID to PEM or DER in any form - every
`genpkey`/`pkeyutl` invocation fails with "No encoders were found",
confirmed directly. So `/hqc/*` shells out to `vendor/hqc-tool`
instead (source: `hqc-tool.c`, built by `setup.sh`), a small custom
program that calls liboqs's own C API directly - the same real
reference implementation, just without going through OpenSSL's
key-encoding layer. Output is hex, not PEM, since there's no standard
encoding for these keys to use yet. `hqc-tool` takes three subcommands
(`keygen <variant>`, `encap <variant> <pubkey-hex>`,
`decap <variant> <privkey-hex> <ciphertext-hex>`), each printing one
line of JSON to stdout; every hex input is length-validated against
the exact size the requested variant expects before being parsed into
a fixed-size buffer.

`setup.sh` builds `vendor/liboqs` (pinned commit, scoped via
`OQS_MINIMAL_BUILD` to just HQC's three parameter sets - a full liboqs
build compiles dozens of algorithms this service never uses) and
`vendor/hqc-tool`. Neither is committed - run `./setup.sh` after
cloning, same as `md5-collision`'s and `lm-cracker`'s vendored tools.

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
slowest single real operation observed (SLH-DSA-SHA2/SHAKE-192s
signing, ~4-4.5s on the production Pi 4B), not a real constraint.
`/slh-dsa/speed` runs 11 signs sequentially, six of them multi-second
"s" variants, so the whole endpoint can take ~20-25s in total - nginx's
`proxy_read_timeout` for `/api/pqc/` is set to 45s (see `DEPLOY.md`) to
give that comfortable headroom, well above the usual 15s used
elsewhere. `variant` and `message` (capped at 500 characters) are the
only user input, and both are validated/sanitised before use. All
OpenSSL invocations use `execFile` with an argument array, never a
shell string.
