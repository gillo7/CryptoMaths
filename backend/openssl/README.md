# openssl

Powers the interactive cipher/decipher demos across the Symmetric
Encryption lesson (and later, Post-Quantum Cryptography). One shared
service, multiple endpoints - this wraps the real `openssl` CLI directly
rather than reimplementing any cipher.

```
POST /enc  { cipher, keyHex, ivHex?, dataHex, noPad? }  ->  { ok: true, dataHex } | { ok: false, error }
POST /dec  { cipher, keyHex, ivHex?, dataHex, noPad? }  ->  { ok: true, dataHex } | { ok: false, error }
```

`cipher` must be one of the names in `ALLOWED_CIPHERS` in `server.js`,
matching exactly what the lesson covers. `keyHex`/`ivHex`/`dataHex` are
raw hex-encoded bytes - no password-based key derivation involved, so
the visitor controls the exact key/IV bytes being used, matching how the
lesson explains symmetric encryption (a shared key, not a password).

A failed decrypt (wrong key, bad padding, tampered ciphertext) returns
`{ ok: false, error }` with OpenSSL's own error message rather than a
generic failure - that's a genuine, useful result for a lesson explaining
why several modes provide no integrity checking.

## Two OpenSSL builds on this server

- **System (`/usr/bin/openssl`, default here)** - OpenSSL 3.0.20 via apt.
  Used for all Symmetric Encryption ciphers.
- **Custom build (`/usr/local/ssl/bin/openssl`)** - OpenSSL 3.5.0, built
  from source at `~/openssl-3.5.0` for Olivier's PQC research, needs
  `LD_LIBRARY_PATH=/usr/local/ssl/lib` to run at all (its shared libs
  aren't in the system's default library path). Has ML-KEM/ML-DSA
  support the system build doesn't. Reserved for the future Post-Quantum
  Cryptography lesson - not used by anything yet.

Which binary a given endpoint uses is just a constant in `server.js`
(`OPENSSL_BIN`, overridable via the `OPENSSL_BIN` env var) - one service,
one safe `execFile`-based command-building path, reused for both.

## Two ciphers the lesson covers that OpenSSL doesn't implement

**Twofish** and **Salsa20** are both absent from OpenSSL entirely (verified
via `openssl list -cipher-algorithms` - neither appears, with or without
the legacy provider). Their lesson pages will need a different
implementation (a small JS/WASM library) or an honest note that no live
demo is available for that specific algorithm, when we get there.

## Legacy provider

DES, RC2, Blowfish, and RC4 are all disabled by default in OpenSSL 3.x
unless the legacy provider is explicitly loaded (`-provider legacy
-provider default`). Verified safe to pass those flags unconditionally
on every request, including for ciphers that don't need them (AES,
ChaCha20) - so `server.js` always includes them rather than maintaining
a per-cipher allowlist of what needs it.

## Run

```bash
node server.js   # listens on 127.0.0.1:8097 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/openssl/` - see the repo's `DEPLOY.md`.

## Safety notes

`openssl enc` is fast regardless of cipher (no CPU-heavy search like the
Hashing backends), so no queueing or long timeout is needed - `TIMEOUT_MS`
is a generous 10s backstop, not a real constraint. Input is capped at 10KB
(`dataHex`) and 64 bytes (`keyHex`/`ivHex`) to keep this a text/demo tool,
not a bulk encryption service. All cipher names are checked against an
explicit allowlist; all data flows through temp files via `execFile` with
an argument array, never a shell string.
