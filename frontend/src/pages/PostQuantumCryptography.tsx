import { Link } from 'react-router-dom'
import PqcBenchmark from './PqcBenchmark'
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
        <a
          href="https://arxiv.org/abs/quant-ph/9508027"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper</span>
          <p className="article-title">
            Polynomial-Time Algorithms for Prime Factorization and
            Discrete Logarithms on a Quantum Computer
          </p>
          <p className="article-byline">
            Peter W. Shor - SIAM Journal on Computing, 1997 (the
            extended version of his original 1994 FOCS paper)
          </p>
        </a>
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
        <a
          href="https://eprint.iacr.org/2022/975.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">An efficient key recovery attack on SIDH</p>
          <p className="article-byline">
            Wouter Castryck, Thomas Decru - EUROCRYPT 2023
          </p>
        </a>
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
          Also, separate from NIST, FrodoKEM, not selected for NIST
          standardisation but adopted independently since, was
          formally standardised by ISO in June 2026 as ISO/IEC
          18033-2:2006/Amd 2:2026, and is recommended by both
          Germany's BSI and ENISA.
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

        <h3>Independently adopted</h3>
        <div className="spec-link-row">
          <Link to="/post-quantum-cryptography/frodokem" className="spec-link">
            FrodoKEM
          </Link>
        </div>

        <h3>Hybrid</h3>
        <div className="spec-link-row">
          <Link to="/post-quantum-cryptography/hybrid" className="spec-link">
            X25519/ML-KEM-768
          </Link>
        </div>
      </section>

      <section>
        <h2>Benchmark</h2>
        <p>
          Below, find a PQC benchmark to compare and contrast all the
          algorithms reviewed above along each of the operations they
          are used for, alongside a full TLS connection test.
        </p>
        <PqcBenchmark />
      </section>

      <section>
        <h2>Quiz!</h2>
        <a
          href="https://www.wikiclass.org/exercise/hjbkmabpq8m6ic7"
          target="_blank"
          rel="noopener noreferrer"
          className="quiz-link"
        >
          Take the Post-Quantum Cryptography quiz on Wikiclass →
        </a>
      </section>
    </main>
  )
}

export default PostQuantumCryptography
