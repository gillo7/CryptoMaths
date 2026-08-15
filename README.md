# CryptoMaths

Cryptography keeps the web secure, ever asked yourself how it works?

**Live at [cryptomaths.org](https://cryptomaths.org)**

CryptoMaths is a small set of interactive lessons explaining the cryptographic
building blocks behind the modern web - starting from first principles
(bits, bytes, encoding) and working up through hashing, symmetric and
asymmetric encryption, digital signatures, and post-quantum cryptography.
Each lesson pairs plain-language explanations with live, in-browser
exercises (type something and watch it get encoded/hashed/etc. in real
time) rather than just static text, and wraps up with a short quiz provided on Wikiclass (another of my projects)

## Status

| Topic | Status |
| --- | --- |
| Encoding | ✅ Live - ASCII, hex, Base64 (+ octal/Base32/Base58), all four with interactive explorers and a quiz |
| Hashing | Not started |
| Symmetric Encryption | Not started |
| Asymmetric Encryption | Not started |
| Signatures and Certificates | Not started |
| Post-Quantum Cryptography | Not started |

## Tech stack

- [React 19](https://react.dev/) + [react-router](https://reactrouter.com/)
- [Vite](https://vite.dev/) for dev/build tooling
- [oxlint](https://oxc.rs/) for linting
- No backend - fully static, deployed as a Vite build behind nginx

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
