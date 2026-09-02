import { Link } from 'react-router-dom'
import PostQuantumPlaceholder from './PostQuantumPlaceholder'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'

function PostQuantumCryptography() {
  return (
    <main className="pqc-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Post-Quantum Cryptography</h1>

      <section>
        <p>
          In 1994, Peter Shor published an article in which he
          demonstrated that if a computer was ever built to take
          advantage of the properties of quantum physics, a "quantum
          computer", which instead of 0s and 1s could leverage bits
          remaining in both states simultaneously, it would be able to
          break the cryptography holding up the modern internet. By
          exploiting a quantum computer's ability to efficiently find
          the period of a function, via the quantum Fourier transform,
          his algorithm turns factoring and discrete log into problems
          solvable in polynomial time instead of exponential time,
          effectively breaking RSA and Elliptic Curve security.
        </p>
        <PostQuantumPlaceholder label="Shor's algorithm article link" />
        <p>
          Today (as I write this, in summer 2026), quantum computers are
          no longer conceptual, but have become a reality at a small
          scale, with Google's Willow chip for example, or IBM's fast
          progress, and governments and large IT companies are investing
          massively to be able to produce a full-scale working quantum
          machine.
        </p>
        <p>
          This means that the day of the CRQC (Cryptographically-Relevant
          Quantum Computer, yes, the field loves acronyms, all my
          apologies) is coming, and scientists and governments worldwide
          are searching for solutions to keep the internet secure after
          the downfall of RSA and Elliptic Curves.
        </p>
      </section>

      <section>
        <h2>NIST Standardisation</h2>
        <p>
          NIST has therefore launched a competition, in the AES-style,
          to find the new algorithms that would be secure against a
          quantum attack. At the time of writing, several algorithms
          have now been standardised: ML-KEM (Kyber), FIPS 203, for key
          generation, ML-DSA (Dilithium), FIPS 204, for signatures, and
          SLH-DSA, FIPS 205, for long-term signatures and certificates.
        </p>
        <p>
          Advanced drafts, and probably soon to be standardised, are
          FN-DSA (Falcon), which mirrors SLH-DSA but with smaller key
          and signature sizes, at the cost of a more complex
          implementation, and HQC (Hamming Quasi-Cyclic), an alternative
          to ML-KEM.
        </p>
        <p>
          Since the infamous incident where SIKE, whilst far into the
          rounds for standardisation, got broken, a number of new and
          different signature schemes have been proposed, to ensure we
          have a number of fallbacks if one of the main methods was
          found to be at risk in the future.
        </p>
        <PostQuantumPlaceholder label="SIKE break article link" />
        <p>
          NIST's additional digital-signature on-ramp has advanced
          candidates built on markedly different mathematical
          foundations, including FAEST, HAWK, MAYO, MQOM, QR-UOV, SDitH,
          SNOVA, SQIsign and UOV, spanning MPC-in-the-head, lattice,
          multivariate and isogeny constructions. These families differ
          not only in signature and key sizes but in their
          key-generation, signing and, crucially, signing-versus-
          verification cost asymmetries, which cannot be assumed to
          resemble those of the lattice-based and hash-based standards.
          Also, separate from NIST, FrodoKEM has been established by
          Germany, and is now formally recommended, as confirmed by
          ENISA's June 2026 draft.
        </p>
        <p>
          This also explains why, rather than migrating directly to a
          full PQC stack, the current IETF recommendation is a
          X25519/ML-KEM-768 hybrid. This way, even if ML-KEM is ever
          found to fail in the future, a reasonable level of security is
          still guaranteed by the secure and tested elliptic curve.
        </p>
      </section>

      <section>
        <h2>Algorithm Details</h2>

        <h3>NIST Standards</h3>
        <div className="spec-link-row">
          <Link to="/post-quantum-cryptography/ml-kem" className="spec-link">
            ML-KEM
          </Link>
          <Link to="/post-quantum-cryptography/ml-dsa" className="spec-link">
            ML-DSA
          </Link>
          <Link to="/post-quantum-cryptography/slh-dsa" className="spec-link">
            SLH-DSA
          </Link>
        </div>

        <h3>Advanced drafts</h3>
        <div className="spec-link-row">
          <Link to="/post-quantum-cryptography/fn-dsa" className="spec-link">
            FN-DSA
          </Link>
          <Link to="/post-quantum-cryptography/hqc" className="spec-link">
            HQC
          </Link>
        </div>

        <h3>European candidate</h3>
        <div className="spec-link-row">
          <a href="#frodokem" className="spec-link">FrodoKEM</a>
        </div>

        <h3>Hybrid</h3>
        <div className="spec-link-row">
          <a href="#hybrid" className="spec-link">X25519/ML-KEM-768</a>
        </div>
      </section>

      <section>
        <h2>Benchmark</h2>
        <p>
          Below, find a PQC benchmark to compare and contrast all the
          algorithms reviewed above along each of the operations they
          are used for, alongside a full TLS connection test.
        </p>
        <PostQuantumPlaceholder label="PQC benchmark: select an operation (key generation / encapsulate-decapsulate / sign-verify / full TLS connection), select algorithms to compare, launch" />
      </section>
    </main>
  )
}

export default PostQuantumCryptography
