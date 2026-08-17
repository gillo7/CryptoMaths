# lm-cracker

Powers the live LM-hash cracking demo on the Hashing lesson's LM page. One
endpoint, no npm dependencies:

```
POST /crack-lm  { lmHash: "<32 hex chars>" }  ->  { cracked: true, password: "..." }
                                              or  { cracked: false }
```

The client computes the LM hash of a password itself (client-side, same
code used everywhere else on the site) and sends *only the hash* - never
the plaintext. The server has no idea what password was typed; it recovers
it the same way a real attacker with a stolen hash dump would.

## Credit

Cracking is done by [John the Ripper](https://www.openwall.com/john/)
(the Debian-packaged core build, `apt install john`), originally by Solar
Designer / [Openwall](https://www.openwall.com/). All the actual password
recovery is John's work - this service just shells out to it with a
deliberately bounded search space and serves the result.

## Setup (once, on the server)

```bash
./setup.sh
```

Installs `john` via apt and adds a demo-specific incremental-mode section
(`[Incremental:CryptoMathsLM]`) to the account's real `~/.john/john.conf`.

Important gotcha found while building this: John looks up its config at
the account's actual home directory (via the password database), **not**
via the `$HOME` environment variable override - so this can't be
sandboxed into an arbitrary config path the way you might expect.

## Run

```bash
node server.js   # listens on 127.0.0.1:8096 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/hashing/lm-crack` - see the repo's `DEPLOY.md`.

## Why the demo is restricted to short passwords

The live demo only reliably cracks passwords of 1-5 characters, using
uppercase letters and digits (36-char alphabet, matching LM's real
case-insensitive behavior). This isn't a cop-out - it's honest to what
LM's actual weakness is: short/simple passwords are catastrophically
weak under LM specifically, which is exactly the point being taught. The
frontend restricts the input to match (`maxLength=5`), so every demo
attempt is guaranteed to succeed.

Measured on the production server (Raspberry Pi 4 B, 4 cores) via
`[Incremental:CryptoMathsLM]`, worst case (full exhaustive search, no
match found) is:

| Search space | Worst case |
| --- | --- |
| MaxLen=3 (47,988 candidates) | 0.21s |
| MaxLen=4 (1.73M candidates) | 0.41s |
| MaxLen=5 (62.2M candidates) | 4.87s |
| MaxLen=6 (2.18B candidates) | ~175s (too slow for a live demo) |

`CRACK_TIMEOUT_MS` in `server.js` is set well above the measured MaxLen=5
worst case for safety margin.

## Safety notes

Only one crack job runs at a time (single-flight queue) since John shares
pot/session state; each request also gets its own temp working directory.
Rate limiting per-IP is handled at the nginx layer, not here.
