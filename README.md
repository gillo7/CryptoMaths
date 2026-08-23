# CryptoMaths

Cryptography keeps the web secure, ever asked yourself how it works?

**Live at [cryptomaths.org](https://cryptomaths.org)**

CryptoMaths is a small set of interactive lessons explaining the cryptographic
building blocks behind the modern web - starting from first principles
(bits, bytes, encoding) and working up through hashing, symmetric
encryption, public key encryption, key exchange, digital signatures, and
post-quantum cryptography.
Each lesson pairs plain-language explanations with live, in-browser
exercises (type something and watch it get encoded/hashed/etc. in real
time) rather than just static text, and wraps up with a short quiz provided on Wikiclass (another of my projects)

## Status

| Topic | Status |
| --- | --- |
| Encoding | Live - ASCII, hex, Base64 (+ octal/Base32/Base58), all four with interactive explorers and a quiz |
| Hashing | Live - intro/salting/attacks, a live multi-algorithm hash explorer, and all 9 algorithm pages (MD5, LM, NTLM, SHA-1, SHA-2, Bcrypt, SHA-3, Scrypt, Argon2) built out with live demos, including a real MD5 collision generator, a real John the Ripper cracking demo and a quiz |
| Symmetric Encryption | Live - IV/padding/modes explainers, all 8 algorithm pages (DES, RC2, Blowfish, Twofish, AES, RC4, Salsa20, ChaCha20) with live encrypt/decrypt demos, a live server-side speed comparison, an in-browser WebCrypto-vs-JS benchmark showing AES-NI's effect on your own hardware, and a quiz |
| Public Key Encryption | Live - RSA history and the Diffie-Hellman/RSA papers, step-by-step live RSA key generation, an interactive toy encrypt/decrypt calculator, live OpenSSL .pem output, a live RSA breaker (factors a real weak key from nothing but its public half), an RSA-vs-ECDSA keygen speed comparison, and a quiz |
| Key Exchange | Live - forward secrecy and why RSA-as-key-exchange falls short, classic Diffie-Hellman (interactive calculator, live .pem output, real speed data on shared-group vs self-generated parameters), ECDH (a live curve-point calculator/plot, live .pem output across P-256/384/521, an RSA speed comparison), and Curves in Practice (the Dual_EC_DRBG backdoor story, a NIST-vs-Curve25519 trust table, a live side-by-side .pem comparison across all five curves, a live keygen speed comparison between them, and a quiz) |
| Signatures and Certificates | Not started |
| Post-Quantum Cryptography | Not started |

## Tech stack

- [React 19](https://react.dev/) + [react-router](https://reactrouter.com/)
- [Vite](https://vite.dev/) for dev/build tooling
- [oxlint](https://oxc.rs/) for linting
- Mostly a static Vite build behind nginx - the few demos that need real
  compute (e.g. the live MD5 collision generator, the live John the Ripper
  cracking demo) are backed by small, standalone Node services in
  `backend/` - see [backend/README.md](backend/README.md)

## Getting started

```bash
cd frontend
npm install
npm run dev      # start the dev server
npm run build     # production build to frontend/dist
npm run lint      # run oxlint
```

## License

MIT - see [LICENSE](LICENSE).
