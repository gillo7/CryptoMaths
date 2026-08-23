# certificates

Powers the live certificate generator on the Certificates lesson. Wraps
the real `openssl` CLI directly rather than reimplementing X.509.

```
POST /generate  { commonName?, organisation? }  ->  { certPem, commonName, organisation }
```

Generates a genuine self-signed X.509 certificate with a fresh RSA-2048
key pair (`openssl req -x509 -newkey rsa:2048 -days 365 -nodes`), valid
for 365 days. Only the certificate PEM is returned - the private key is
generated purely to produce a valid self-signed cert and is discarded
with the rest of the temp directory, never sent to the client, matching
the "a private key never leaves the machine it was generated on"
point made on the lesson page itself.

`commonName`/`organisation` feed the certificate's Subject
(`/CN=.../O=...`); both default to `Alice` / `CryptoMaths Demo` and are
stripped of `/`, `\`, `=`, and newlines before use, since those
characters are significant to openssl's `-subj` parsing.

## Run

```bash
node server.js   # listens on 127.0.0.1:8100 by default (set PORT to change)
```

Intended to run behind nginx as an internal-only service, proxied at
`/api/certificates/` - see the repo's `DEPLOY.md`.

## Safety notes

Certificate generation at RSA-2048 is fast, so no queueing or long
timeout is needed - `TIMEOUT_MS` is a generous 10s backstop, not a real
constraint. All OpenSSL invocations use `execFile` with an argument
array, never a shell string.
