import { Link } from 'react-router-dom'
import TlsScan from './TlsScan'
import './Tls.css'
import './SymmetricEncryption.css'
import './Hashing.css'

function Tls() {
  return (
    <main className="tls-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>TLS</h1>

      <section>
        <h2>Before TLS 1.3</h2>
        <p>
          SSL 1.0 never actually shipped publicly. An internal security
          flaw was caught during Netscape's own review before the
          protocol ever reached a real user, the only version in this
          whole lineage that never had the chance to fail in
          production.
        </p>
        <p>
          SSL 2.0, released in 1995, made it out the door, and quickly
          proved why 1.0 had been held back. Its message authentication
          was weak, it had no protection against an attacker forcing a
          downgrade to a weaker configuration, and it left the
          handshake itself unauthenticated. It took over fifteen years
          for the industry to formally close the door: the IETF{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc6176"
            target="_blank"
            rel="noopener noreferrer"
          >
            deprecated SSL 2.0 outright in 2011
          </a>
          , prohibiting its use entirely, not just discouraging it.
        </p>
        <p>
          SSL 3.0 followed in 1996 and fixed much of what 2.0 got
          wrong, a genuinely solid protocol for its era. It held for
          nearly two decades before its own weakness surfaced: in 2014,
          the POODLE attack exploited a padding flaw in how SSL 3.0's
          CBC-mode ciphers handled malformed data, letting an attacker
          recover encrypted content byte by byte. SSL 3.0 was{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc7568"
            target="_blank"
            rel="noopener noreferrer"
          >
            formally deprecated
          </a>{' '}
          the following year.
        </p>
        <a
          href="https://openssl-library.org/files/ssl-poodle.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            This POODLE Bites: Exploiting The SSL 3.0 Fallback
          </p>
          <p className="article-byline">
            Bodo Möller, Thai Duong, Krzysztof Kotowicz - Google, 2014
          </p>
        </a>
        <p>
          TLS (Transport Layer Security) itself, the protocol's proper
          name from version 1.0 onward, SSL just rebranded rather than
          reinvented, is SSL's direct successor. TLS 1.0 arrived in
          1999 and eventually fell to BEAST, a 2011 attack against the
          same CBC-mode weakness SSL 3.0 shared. TLS 1.1 followed in
          2006, addressing that specific flaw, but never saw wide
          independent adoption before TLS 1.2 arrived and largely
          superseded it. Both were{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc8996"
            target="_blank"
            rel="noopener noreferrer"
          >
            formally deprecated together in 2021
          </a>
          , twenty years and ten years after their respective releases.
        </p>
        <a
          href="https://tlseminar.github.io/docs/beast.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">Here Come The ⊕ Ninjas</p>
          <p className="article-byline">
            Thai Duong, Juliano Rizzo - 2011
          </p>
        </a>
      </section>

      <section>
        <h2>TLS 1.3</h2>
        <p>
          TLS 1.3, released in 2018, is the direct response to this
          entire pattern: rather than patching individual weak cipher
          suites one at a time, it simply removed the mechanism that
          made downgrade attacks possible at all. The handshake was cut
          from two round trips to one, cutting connection latency;
          static RSA key exchange was removed entirely, making
          ephemeral key exchange and forward secrecy mandatory rather
          than optional; the number of supported cipher suites was
          reduced from dozens to five, all authenticated encryption;
          CBC mode, RC4, MD5, SHA-1, and export-grade ciphers were
          dropped outright; and more of the handshake itself, including
          the server's certificate, is now encrypted, reducing what an
          eavesdropper can learn just from watching the exchange
          happen. The result, formally proven rather than just
          assumed, is a protocol with no legacy fallback path that
          could silently downgrade to something weaker, exactly why
          it's the correct baseline for testing how PQC algorithms
          actually integrate into a real protocol.
        </p>
        <p>
          The TLS 1.3 handshake, step by step, naming the algorithms
          covered elsewhere in this app at each stage:
        </p>
        <ol>
          <li>
            <strong>ClientHello:</strong> the client generates an
            ephemeral key pair, using ECC P-256, X25519, ML-KEM, or the
            hybrid X25519+ML-KEM-768 covered in the{' '}
            <Link to="/key-exchange">Key Exchange</Link> and{' '}
            <Link to="/post-quantum-cryptography">Post-Quantum</Link>{' '}
            chapters. The public key is sent in plaintext, nothing is
            secured yet.
          </li>
          <li>
            <strong>ServerHello:</strong> the server responds with its
            own key share. For the Diffie-Hellman options, this is a
            fresh public value, both sides independently derive the
            same shared secret from their own private key and the
            other party's public value. For ML-KEM, the server instead
            encapsulates a random shared secret using the client's
            public key and sends back the resulting ciphertext. The
            hybrid combines both mechanisms at once. From this point
            on, everything is encrypted.
          </li>
          <li>
            <strong>Key Derivation:</strong> the shared secret from
            step 2, however it was obtained, gets turned into the
            actual session keys via HKDF, covered in the{' '}
            <Link to="/symmetric-encryption/keyed-constructions">
              Symmetric Encryption chapter's Keyed Constructions
              section
            </Link>
            , the exact mechanism that takes one shared secret and
            produces every key the rest of the handshake runs on.
          </li>
          <li>
            <strong>Certificate:</strong> the server sends its
            certificate, binding its identity to its public key,
            covered in the <Link to="/certificates">Certificates</Link>{' '}
            chapter.
          </li>
          <li>
            <strong>CertificateVerify:</strong> the server signs the
            entire handshake transcript using its certificate's
            private key, this is where RSA-PSS, ECDSA, Ed25519, or
            ML-DSA come in.
          </li>
          <li>
            <strong>Server Authentication Verified:</strong> the client
            checks that signature against the certificate's public
            key, proof the server genuinely holds the matching private
            key.
          </li>
          <li>
            <strong>Finished:</strong> both sides exchange a final
            confirmation. All subsequent traffic is encrypted using the
            negotiated AEAD algorithm,{' '}
            <Link to="/symmetric-encryption/block-ciphers">
              AES-128-GCM
            </Link>{' '}
            or{' '}
            <Link to="/symmetric-encryption/stream-ciphers/chacha20">
              ChaCha20-Poly1305
            </Link>
            , both covered in this app's own Symmetric Encryption
            chapter.
          </li>
        </ol>
        <p>
          Steps 1-3 are exactly where the harvest-now-decrypt-later
          threat strikes: the key exchange happens in the clear, and a
          future quantum computer applying{' '}
          <Link to="/post-quantum-cryptography">Shor's algorithm</Link>{' '}
          to a captured exchange would recover the shared secret and
          unlock every message from step 7 onward. Steps 4-6 carry a
          different, narrower risk: a broken signature algorithm could
          let an attacker forge a certificate for a future connection,
          but it doesn't retroactively decrypt anything already
          recorded, since a signature protects who you're talking to,
          not the confidentiality of what you say to them.
        </p>
        <p>
          Symmetric algorithms themselves aren't currently at risk from
          quantum computers the way key exchange and signatures are,
          Grover's algorithm only halves their effective strength,
          reducing AES-128 to an effective 64-bit security level, which
          is why 256-bit keys are the recommended standard going
          forward, covered in the Symmetric Encryption chapter's{' '}
          <Link to="/symmetric-encryption/block-ciphers/aes">
            AES section
          </Link>
          . That's exactly why PQC migration efforts focus almost
          entirely on key exchange and signatures, ML-KEM and ML-DSA,
          rather than on symmetric ciphers, which barely need to change
          at all.
        </p>
      </section>

      <section>
        <h2>Live demo</h2>
        <TlsScan />
      </section>
    </main>
  )
}

export default Tls
