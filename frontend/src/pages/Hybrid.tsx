import { Link } from 'react-router-dom'
import { fetchKemSpeed } from '../lib/pqcDemo'
import HybridExchange from './HybridExchange'
import PqcSpeedCompare from './PqcSpeedCompare'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'
import './Hashing.css'

function Hybrid() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>Hybrid (X25519 + ML-KEM-768)</h1>

      <section>
        <p>
          A hybrid key exchange combines a classical algorithm and a
          post-quantum algorithm in parallel, rather than choosing one
          or the other.{' '}
          <Link to="/key-exchange/curves">X25519</Link> +{' '}
          <Link to="/post-quantum-cryptography/ml-kem">ML-KEM-768</Link>{' '}
          is currently the recommended migration path, formalised by
          the IETF as a named TLS 1.3 key exchange codepoint. The idea
          is simple: if ML-KEM is ever found to be broken, the
          connection is still protected by X25519.
        </p>
        <p>
          Concretely, the client's ClientHello carries both an X25519
          public key and an ML-KEM-768 encapsulation key, generated
          independently, neither shared secret exists yet at this
          point. The server completes both halves in its ServerHello,
          an X25519 ECDH computation producing a classical shared
          secret, and an ML-KEM-768 encapsulation producing a
          lattice-based shared secret, sent back as a ciphertext the
          client decapsulates to recover the same value. The two
          secrets are combined by simple concatenation before being
          fed into the TLS 1.3 key schedule, not any operation that
          could cancel information between the two halves. That
          matters directly: an adversary must recover both halves to
          recover the combined secret, so security is lower-bounded by
          whichever component remains unbroken, not their average. If
          ML-KEM-768 is later found flawed, the connection stays
          exactly as safe as classical X25519 TLS is today; if a
          quantum computer arrives, it stays exactly as safe as
          ML-KEM-768 alone. This "belt and braces" floor is the entire
          reason to use a hybrid at all during the migration period,
          rather than committing to ML-KEM outright.
        </p>
        <p>
          That security floor is not free, and the cost is additive,
          not shared. The client completes both key exchanges in full,
          paying the full cost of X25519 and the full cost of
          ML-KEM-768, with nothing shared between them. On hardware
          where both are similarly cheap, that's a modest overhead. On
          hardware where one component is disproportionately
          expensive, the hybrid inherits that cost in full on top of
          the other, rather than being able to fall back to the
          cheaper path alone.
        </p>
        <p>
          There is also a real, easily missed limitation of scope, not
          cost: a hybrid key exchange protects the key exchange only,
          not authentication. The signature verifying the server's
          identity is generated with whatever algorithm is separately
          negotiated, RSA-PSS, ECDSA, or Ed25519 in the classical case,
          and none of those become quantum-safe merely by sitting next
          to a hybrid key exchange. A quantum adversary who cannot read
          the traffic can, given a large enough quantum computer, still
          forge the server's classical signature and impersonate it
          outright. Confidentiality is protected; the endpoint's
          identity is not, unless the signature algorithm is also
          upgraded to{' '}
          <Link to="/post-quantum-cryptography/ml-dsa">ML-DSA</Link>.
        </p>
        <p>
          Worth knowing the pattern has already been formalised as its
          own named construction: X-Wing, a combiner scheme
          specifically optimised for X25519 and ML-KEM-768 together,
          rather than the generic concatenation approach described
          above.
        </p>
        <a
          href="https://eprint.iacr.org/2024/039.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            X-Wing: The Hybrid KEM You've Been Looking For
          </p>
          <p className="article-byline">
            Manuel Barbosa, Deirdre Connolly, João Diogo Duarte, Aaron
            Kaiser, Peter Schwabe, Karolin Varner, Bas Westerbaan -
            IACR Communications in Cryptology, 2024
          </p>
        </a>
        <HybridExchange />
        <PqcSpeedCompare
          description="X25519 alone, ML-KEM-768 alone, and the hybrid combination (measured honestly as both real operations added together, since there is no single OpenSSL call for the combined key), against the classical algorithms it competes with:"
          buttonLabel="Run a live speed test on the server"
          fetchSpeed={fetchKemSpeed}
          note="Every figure below is the median of 25 real runs, not
            just one - at these speeds, a single run is dominated by
            process-spawn overhead rather than the actual keygen cost.
            The hybrid row is genuinely additive here, not shared: it
            is X25519's own time plus ML-KEM-768's own time, exactly
            the cost trade the page above describes."
          loadingHint="Running 150 real keygens, roughly 10 seconds…"
        />
      </section>
    </main>
  )
}

export default Hybrid
