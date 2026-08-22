import { Link } from 'react-router-dom'
import EcdhToyCalculator from './EcdhToyCalculator'
import EcdhPemOutput from './EcdhPemOutput'
import './KeyExchange.css'
import './SymmetricEncryption.css'
import './Hashing.css'

function Ecdh() {
  return (
    <main className="key-exchange-page">
      <Link to="/key-exchange" className="back-link">
        ← Back to Key Exchange
      </Link>

      <h1>ECDH (Elliptic Curve Diffie-Hellman)</h1>

      <section>
        <p>
          Elliptic curve cryptography itself predates ECDH's application,
          first proposed independently by Neal Koblitz and Victor Miller,
          both in 1985, roughly a decade after Diffie and Hellman's own
          original breakthrough. Miller's foundational paper, "Use of
          Elliptic Curves in Cryptography," was presented at CRYPTO '85.
        </p>
        <a
          href="https://link.springer.com/chapter/10.1007/3-540-39799-X_31"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper</span>
          <p className="article-title">Use of Elliptic Curves in Cryptography</p>
          <p className="article-byline">
            Victor S. Miller - CRYPTO '85, Lecture Notes in Computer
            Science vol. 218, Springer, 1985
          </p>
        </a>

        <p>
          ECDH takes their idea and applies it to the same key exchange
          problem Diffie-Hellman already solved, just on a different
          mathematical structure.
        </p>
        <p>
          Classic Diffie-Hellman uses exponentiation, gᵃ mod p. ECDH uses
          the same underlying idea, but replaces exponentiation with
          scalar point multiplication on an elliptic curve, taking a
          known starting point and "stepping along" the curve n times,
          where n is the private key.
        </p>
        <p>
          A public curve point, G, is agreed on in advance, the same role
          p and g played for classic DH. Each party picks a private
          scalar, computes their public key by multiplying G by that
          scalar, and shares the result. Computing P = n × G from n is
          easy. Recovering n from P and G is the elliptic curve discrete
          logarithm problem, computationally infeasible for a well-chosen
          curve, this is ECDH's entire security guarantee, the direct
          curve equivalent of RSA's factoring problem or classic DH's
          discrete log.
        </p>

        <h2>The ECDH Exchange Flow</h2>
        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Alice</th>
                <th>Bob</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Private key</td>
                <td>a (secret)</td>
                <td>b (secret)</td>
              </tr>
              <tr>
                <td>Public key</td>
                <td>A = a × G</td>
                <td>B = b × G</td>
              </tr>
              <tr>
                <td>Exchange</td>
                <td>Sends A to Bob</td>
                <td>Sends B to Alice</td>
              </tr>
              <tr>
                <td>Shared secret</td>
                <td>a × B = a × b × G</td>
                <td>b × A = b × a × G</td>
              </tr>
              <tr>
                <td>Result</td>
                <td colSpan={2}>
                  <strong>Same shared secret = a × b × G</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Eve sees G, A, and B, everything exchanged in the open, but
          solving A = a × G for a is the ECDLP, computationally
          infeasible.
        </p>
        <EcdhToyCalculator />

        <p>
          Real ECDH uses one of a small set of standard curves, not a toy
          example like the one above. P-256, P-384, and P-521 are the
          NIST curves you'll meet most often, named for their key size in
          bits, 256, 384, and 521. That's dramatically smaller than an
          equivalent-strength RSA key: 256-bit ECC is roughly as hard to
          break as 3072-bit RSA, 384-bit ECC roughly matches 7680-bit RSA,
          the same efficiency gain covered earlier in this chapter, now
          with real curves instead of a hand-worked toy.
        </p>
        <EcdhPemOutput />
      </section>

      <section>
        <h2>Ephemeral keys, ECDHE</h2>
        <p>
          The public keys used in ECDH can be static, long-term and
          trusted via a certificate, or ephemeral, generated fresh for a
          single session and discarded afterward, this variant is called
          ECDHE, the final E standing for ephemeral. Ephemeral keys are
          exactly what closes the forward-secrecy gap this whole chapter
          opened with: since a fresh key pair is generated every session,
          compromising one session's private key reveals nothing about
          any other session, past or future. Static keys remain useful
          too, and prevent man-in-the-middle attacks in a way ephemeral
          keys alone don't, which is why real protocols like TLS often
          combine both, an ephemeral key for the exchange itself,
          authenticated by a static, certificate-backed identity key.
          Certificates are explored in depth in their own section.
        </p>
        <p>
          A genuine real-world caveat worth knowing: if one party
          maliciously sends curve points that don't actually belong to
          the agreed curve, and the other side fails to validate them, an
          attacker can gradually recover the victim's private key. This
          "invalid curve attack" was found to affect several real-world
          TLS libraries in practice, a reminder that ECDH's security
          guarantee only holds if implementations actually check their
          inputs, not just that the underlying maths is sound.
        </p>
        <p>
          ECDH is also dramatically faster than classic Diffie-Hellman
          when Diffie-Hellman has to generate its own parameters rather
          than reuse a standard group, as you already saw on the{' '}
          <Link to="/key-exchange/diffie-hellman">Diffie-Hellman</Link>{' '}
          page.
        </p>
        <p>
          And it's everywhere in practice, it's the mechanism behind
          Tor's ntor handshake, in continuous use since 2013, it
          underpins the Signal Protocol's post-compromise security, used
          in Signal and Facebook Messenger, and LINE's "Letter Sealing"
          end-to-end encryption has run on ECDH since 2015.
        </p>
      </section>
    </main>
  )
}

export default Ecdh
