# pqc

Powers the live demos across the whole Post-Quantum Cryptography
chapter: every algorithm page (ML-KEM, ML-DSA, SLH-DSA, HQC, FN-DSA,
FrodoKEM), the Hybrid (X25519 + ML-KEM-768) page, and the hub page's
own cross-algorithm Benchmark tool. Wraps a real `openssl` CLI directly
where that's possible; HQC, FN-DSA and FrodoKEM need a different
approach entirely - see below.

```
POST /ml-kem/keygen        { variant }        -> { variant, publicPem, privatePem }
POST /ml-kem/encap-decap   { variant }        -> { variant, publicPem, ciphertextHex, ciphertextBytes, bobSecretHex, aliceSecretHex, matched }
POST /ml-kem/speed                            -> { results: [{ label, ms }] }
POST /ml-dsa/sign     { variant, message }    -> { variant, publicPem, message, signatureHex, signatureBytes, verified }
POST /ml-dsa/speed                            -> { results: [{ label, ms }] }
POST /slh-dsa/sign    { variant, message }    -> same shape as /ml-dsa/sign
POST /slh-dsa/speed                           -> { results: [{ label, ms }] }
POST /hqc/keygen       { variant }            -> { variant, publicKeyHex, privateKeyHex, publicKeyBytes, privateKeyBytes }
POST /hqc/encap-decap  { variant }            -> { variant, publicKeyHex, publicKeyBytes, ciphertextHex, ciphertextBytes, bobSecretHex, aliceSecretHex, matched }
POST /hqc/speed                               -> { results: [{ label, ms }] }
POST /fn-dsa/sign      { variant, message }   -> { variant, message, signatureHex, signatureBytes, verified } (no publicPem - no OID yet)
POST /fn-dsa/speed                            -> { results: [{ label, ms }] }
POST /frodokem/keygen      { variant }        -> same shape as /hqc/keygen
POST /frodokem/encap-decap { variant }        -> same shape as /hqc/encap-decap
POST /frodokem/speed                          -> { results: [{ label, ms }] }
POST /hybrid/exchange                         -> { x25519SecretHex, x25519SecretBytes, x25519Matched, mlkemCiphertextBytes, mlkemSecretHex, mlkemSecretBytes, mlkemMatched, combinedSecretHex, combinedSecretBytes, combinedMatched }
POST /benchmark/keygen       { ids: string[] } -> { results: [{ label, ms }] }
POST /benchmark/encap-decap  { ids: string[] } -> { results: [{ label, ms }] }
POST /benchmark/sign-verify  { ids: string[] } -> { results: [{ label, ms }] }
POST /benchmark/tls          { ids: string[] } -> { results: [{ label, ms }] }
```

`variant` is checked against an explicit allowlist per algorithm:
`ML-KEM-512/768/1024`, `ML-DSA-44/65/87`, the nine SLH-DSA parameter
sets matching the dissertation's own `benchmark.py` selection -
`SHA2-128s/128f`, `SHAKE-128s`, `SHA2-192s/192f`, `SHAKE-192s`,
`SHA2-256s/256f`, `SHAKE-256s` (SHA2 gets both `s` and `f` at every
level, SHAKE only `s`) - `HQC-128/192/256`, `Falcon-512/1024`, and
`FrodoKEM-640/976/1344-AES/SHAKE` (six variants). `/benchmark/*`
routes take an `ids` array instead of a single `variant`, checked
against that endpoint's own catalog (see below) - unknown ids are
silently skipped, not rejected.

## HQC, FN-DSA and FrodoKEM: liboqs directly, not OpenSSL

None of these three has OpenSSL support, for three different reasons:
HQC has no assigned OID yet (still pre-standardisation - NIST selected
it in March 2025, a final FIPS standard is targeted for 2027) and
OpenSSL's `oqs-provider` (built and tested while diagnosing this)
cannot serialise a key with no OID to PEM or DER in any form, every
`genpkey`/`pkeyutl` invocation fails with "No encoders were found",
confirmed directly. FN-DSA (Falcon) has no FIPS 206 text released yet
at all. FrodoKEM, despite being ISO standardised in June 2026, still
has zero support in OpenSSL 3.5 (confirmed via `openssl list
-kem-algorithms`).

So `/hqc/*` and `/frodokem/*` shell out to `vendor/hqc-tool` (source:
`hqc-tool.c`, built by `setup.sh`), and `/fn-dsa/*` to
`vendor/sig-tool` (source: `sig-tool.c`) - both small custom programs
that call liboqs's own C API directly, the same real reference
implementation, just without going through OpenSSL's key-encoding
layer. Output is hex, not PEM, since there's no standard encoding for
these keys to use yet. `hqc-tool` grew from HQC-only to also cover
FrodoKEM once that came up, rather than duplicating an identical tool
under a second name - the KEM keygen/encap/decap mechanics via
liboqs's `OQS_KEM` API are identical regardless of algorithm, only its
`alg_for()` lookup needed extending. Both tools take the same shape of
subcommands (`keygen <variant>`, `encap <variant> <pubkey-hex>` /
`sign <variant> <privkey-hex> <message>`, `decap`/`verify` likewise),
each printing one line of JSON to stdout; every hex input is
length-validated against the exact size the requested variant expects
before being parsed into a fixed-size buffer. Falcon signatures are
genuinely variable-length (unlike every fixed-size KEM output here),
so `sig-tool`'s reported `signatureBytes` varies run to run - that's
real, not a bug.

`setup.sh` builds `vendor/liboqs` (pinned commit, scoped via
`OQS_MINIMAL_BUILD` to just the parameter sets actually used -
`KEM_hqc_1;KEM_hqc_3;KEM_hqc_5;SIG_falcon_512;SIG_falcon_1024;KEM_frodokem_640_aes;KEM_frodokem_640_shake;KEM_frodokem_976_aes;KEM_frodokem_976_shake;KEM_frodokem_1344_aes;KEM_frodokem_1344_shake`
- a full liboqs build compiles dozens of algorithms this service never
uses) and both `vendor/hqc-tool` and `vendor/sig-tool`. Neither the
liboqs build nor either tool is committed - run `./setup.sh` after
cloning, same as `md5-collision`'s and `lm-cracker`'s vendored tools.

## Hybrid: two real operations, combined honestly

`X25519MLKEM768` is a TLS 1.3 group name, not a standalone encodable
key - `genpkey -algorithm X25519MLKEM768` fails outright with "No
encoders were found", confirmed directly. `/hybrid/exchange` instead
runs the two real, independent operations a hybrid handshake actually
performs - a full X25519 ECDH derivation (both sides, via `pkeyutl
-derive`) and a full ML-KEM-768 encapsulate/decapsulate - then
concatenates the two resulting secrets exactly as TLS 1.3's key
schedule does. Both halves are genuinely verified to match
independently before being combined.

## Benchmark: a catalog-driven selection layer, not new crypto

`/benchmark/{keygen,encap-decap,sign-verify}` let the hub page's
reader pick any combination of algorithms - classical baselines
included - across the whole chapter and run them all for real, back
to back. Each is a flat catalog array (`BENCHMARK_KEYGEN_CATALOG` etc.
in `server.js`) mapping an `id` to how to run it (`openssl`
genpkey/sign, or the `hqc-tool`/`sig-tool` equivalents) - this is
purely a selection layer over the exact same execution paths every
other route above already uses, not a new way of running crypto. The
six slow SLH-DSA "s" signing variants are marked `slow: true` and run
single-shot rather than median-of-many, matching `/slh-dsa/speed`'s
existing precedent - keygen for those same variants is NOT slow
(~330ms even for 256s, measured directly), so only the sign-verify
catalog needs that treatment.

`/benchmark/tls` is a different kind of thing entirely: the site's
only network-level demo, not an in-process crypto call. There is no
single OpenSSL command for "time a full TLS handshake with a chosen
group and signature algorithm", so `timeTlsProfile()` spins up a
genuine ephemeral `openssl s_server` locally (fresh self-signed cert
per profile) and times real `openssl s_client` handshakes against it
across five fixed profiles, from fully classical to fully
post-quantum. **The server child process's stdin must be explicitly
set to `stdio: ['ignore', 'pipe', 'pipe']`** - left as Node's default
open, never-written pipe, `s_server`'s internal select() loop never
services the socket at all and every handshake hangs until the
client's own timeout fires, even though the port is genuinely
listening (confirmed via `ss` and a raw TCP connect). This only shows
up when Node spawns both the server and the client itself; a
shell-backgrounded server never had the problem. TLS group names also
differ from the `-algorithm` names used everywhere else in this
service and had to be looked up via `openssl list -tls-groups` -
lowercase `x25519`/`secp256r1` for classical, but `MLKEM768`/
`X25519MLKEM768` (no hyphens, different casing) for the PQC ones.

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
"s" variants, so the whole endpoint can take ~20-25s in total; the
`/benchmark/*` routes can run an even larger number of operations if
the reader selects heavily, so nginx's `proxy_read_timeout` for
`/api/pqc/` is set to 90s (see `DEPLOY.md`, bumped from 45s when
`/benchmark/*` was added) - verified directly that selecting literally
every catalog entry stays well under that ceiling for every operation
(worst observed: ~32s). `variant`/`message` (capped at 500 characters)
and `ids` (an array, checked against a fixed catalog, unknown entries
skipped) are the only user input, and all are validated/sanitised
before use. Every ephemeral TLS server spawned by `/benchmark/tls`
binds to a randomised high port and is `kill()`ed in a `finally` block
regardless of outcome, same pattern as every temp directory used
elsewhere in this service. All OpenSSL invocations use `execFile`/
`spawn` with an argument array, never a shell string.
