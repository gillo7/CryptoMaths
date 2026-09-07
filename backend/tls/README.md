# tls

Powers the live demo on the TLS chapter's own page: real proof of what
protocol/cipher your own browser just negotiated to load the page, and
a live scan of what this server's own nginx listener accepts.

```
POST /scan   -> { yourConnection: { protocol, cipher }, serverChecks: [{ id, label, supported, protocol?, cipher? }] }
```

No request body - the browser's own connection info arrives as nginx
headers on every request to this location already (see below), and the
server checks are a fixed set run fresh on every call.

## Your connection: real, not simulated

nginx forwards the ACTUAL negotiated protocol and cipher for the
request that's arriving right now via two custom headers, set in its
own `location /api/tls/` block:

```
proxy_set_header X-Client-TLS-Protocol $ssl_protocol;
proxy_set_header X-Client-TLS-Cipher $ssl_cipher;
```

This service just reads `x-client-tls-protocol`/`x-client-tls-cipher`
off the incoming request and echoes them back - it's nginx's own live
record of the TLS handshake the browser just completed to fetch this
page, not anything this service could fabricate or cache.

## Server checks: real handshakes, every call

`scanServer()` runs six genuine `openssl s_client` connections against
`127.0.0.1:443` (loopback, not out over the internet to this box's own
public IP) with `-servername cryptomaths.org` so nginx's SNI-based
config picks the exact same certificate/cipher policy a real visitor
would get:

- TLS 1.0 and 1.1: expected rejected outright ("no protocols
  available") - certbot's modern nginx config only offers 1.2/1.3.
- TLS 1.2 and 1.3 (no forced cipher): whatever nginx negotiates by
  default at each version.
- TLS 1.2 forced to a legacy cipher (`ECDHE-ECDSA-AES128-SHA`, a real
  CBC + SHA-1 suite): expected rejected, nginx's cipher list excludes
  it.
- TLS 1.2 forced to a modern cipher (`ECDHE-ECDSA-CHACHA20-POLY1305`):
  expected accepted.

Both forced-cipher checks deliberately use **ECDSA** suite names, not
RSA ones - this server's certificate is ECDSA, so any `ECDHE-RSA-*`
suite fails with a handshake error regardless of nginx's actual cipher
policy, for a completely unrelated reason (no RSA certificate to use),
which would make the demo's "rejected" result misleading. Confirmed
directly while building this: `ECDHE-RSA-AES128-GCM-SHA256`, a
perfectly modern, unremarkable cipher, fails here purely because of
the certificate type mismatch, not because nginx disabled it.

Each check spawns `openssl s_client` via `spawn` (not `execFile`),
closes its stdin immediately, and parses `-brief` output for
`Protocol version:`/`Ciphersuite:` lines - same client-side pattern as
the PQC chapter's own TLS handshake benchmark (`backend/pqc/`), reused
here since it already solves the "s_client needs its stdin closed to
exit cleanly" problem.

## Run

```bash
node server.js   # listens on 127.0.0.1:8102 by default (set PORT to change)
```

`TARGET_HOST` (default `cryptomaths.org`) and `TARGET_ADDR` (default
`127.0.0.1:443`) are both overridable via env vars if this ever needs
pointing at a different domain/port.

Intended to run behind nginx as an internal-only service, proxied at
`/api/tls/` - see the repo's `DEPLOY.md`. That location block is the
one piece of this demo that can't be tested by just running
`server.js` locally - the `X-Client-TLS-*` headers only exist because
nginx sets them, so hitting this service directly (bypassing nginx)
always returns `null` for `yourConnection`.

## Safety notes

Six real TCP connections and TLS handshakes per call, each capped at
an 8s timeout and `kill()`ed if it hangs - in practice every check
resolves in well under a second on loopback (either a handshake
completes or the rejection is immediate), but the true worst case, if
every single check somehow hung, is 6 x 8s = 48s. nginx's
`proxy_read_timeout` for `/api/tls/` is set to 60s specifically to stay
above that ceiling - it was initially left at 30s (copied from a
neighbouring location) and only caught while writing this file, fixed
before it could ever actually bite. No user input at all - `/scan`
takes no request body, so there's nothing to validate or sanitise.
