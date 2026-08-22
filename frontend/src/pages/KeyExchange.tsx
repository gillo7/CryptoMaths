import { Link } from 'react-router-dom'
import KeyExchangePlaceholder from './KeyExchangePlaceholder'
import './KeyExchange.css'
import './SymmetricEncryption.css'

function KeyExchange() {
  return (
    <main className="key-exchange-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Key Exchange</h1>

      <section>
        <h2>Overview</h2>
        <p>
          Public-key encryption, RSA, lets Alice encrypt something directly
          using Bob's public key. Key exchange solves a related but
          different problem: how do two parties who share no secret in
          advance arrive at the same shared secret together, without ever
          transmitting it at all?
        </p>
        <p>
          RSA can technically do key exchange too, Alice generates a
          symmetric key, encrypts it with Bob's public key, sends it, Bob
          decrypts it with his private key. But this has a lasting
          weakness worth taking seriously: forward secrecy. Imagine Eve
          records all of Bob and Alice's encrypted traffic today,
          patiently, for years. If Bob's RSA private key is ever
          compromised, even long after the fact, Eve can retroactively
          decrypt everything she recorded, one compromised key unlocks
          every past conversation ever protected by it.
        </p>
        <p>
          Diffie-Hellman closes that gap. Instead of encrypting and
          sending a key, both parties independently compute the very same
          secret through mathematics alone, and because that computation
          typically uses fresh, disposable values each session,
          compromising one conversation's secret doesn't expose any
          other. This chapter covers Diffie-Hellman's original form over
          integers, its modern elliptic-curve version, ECDH, and the
          specific curves actually used in practice today.
        </p>
      </section>

      <section>
        <div className="section-grid">
          <Link to="/key-exchange/diffie-hellman" className="section-button">
            Diffie-Hellman
          </Link>
          <Link to="/key-exchange/ecdh" className="section-button">
            ECDH
          </Link>
          <Link to="/key-exchange/curves" className="section-button">
            Curves
          </Link>
        </div>
      </section>

      <section>
        <p>
          However, just as RSA will be broken by a CRQC
          (Cryptographically-Relevant-Quantum-Computer), ECC have the same
          inherent weakness. They are vulnerable to Shor's algorithm.
          Current recommended implementations actually promote a hybrid
          ECC/PQC approach (x25519/ML-KEM-768): by mixing both, we are
          secure against Shor's in the future, but also have a failsafe
          back if ML-KEM-768 is ever broken one day, explored further in
          the <Link to="/post-quantum-cryptography">Post-Quantum Cryptography</Link>{' '}
          section.
        </p>
      </section>

      <section>
        <h2>Quiz!</h2>
        <KeyExchangePlaceholder label="Link to a Wikiclass open quiz" />
      </section>
    </main>
  )
}

export default KeyExchange
