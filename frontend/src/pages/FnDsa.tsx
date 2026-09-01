import { Link } from 'react-router-dom'
import { signAndVerifyFnDsa } from '../lib/pqcDemo'
import PqcSignExample from './PqcSignExample'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'
import './Hashing.css'

const FN_DSA_VARIANTS = ['Falcon-512', 'Falcon-1024'] as const

function FnDsa() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>FN-DSA</h1>

      <section>
        <p>
          FN-DSA, to be standardised by NIST as FIPS 206, is better
          known by the name it carried throughout its development,
          Falcon. As of the most recent NIST update on its progress,
          FIPS 206 has not yet even reached Initial Public Draft
          stage, the text is written but still awaiting approval for
          release. Like{' '}
          <Link to="/post-quantum-cryptography/ml-dsa">ML-DSA</Link>,
          it is a lattice-based signature scheme, but built on a
          different structure entirely: where ML-DSA derives from
          module lattices and CRYSTALS-Dilithium, FN-DSA derives from
          NTRU, using a hash-then-sign construction where the
          signature is a lattice point close to a target derived from
          a randomised hash of the message.
        </p>
        <p>
          Key generation samples two short polynomials, f and g, then
          computes F and G satisfying the NTRU equation
        </p>
        <div className="code-block">
          <code>fG − gF = q</code>
        </div>
        <p>
          The resulting basis, arranged as a matrix of f, g, F and G,
          forms the private key, checked against a Gram-Schmidt norm
          bound and reduced until small enough to encode; if any check
          fails, generation simply restarts. The public key is derived
          as h = f⁻¹g (mod q).
        </p>
        <p>
          The appeal of this construction is size. At the same
          security level as ML-DSA-44, roughly equivalent to
          RSA-2048, Falcon-512 produces a public key of 897 bytes and
          a signature of just 690 bytes, smaller than ML-DSA-44's
          2,420-byte signature by more than a factor of three.
          Falcon-1024, at the higher security level, still keeps its
          signature to 1,280 bytes, still meaningfully smaller than
          ML-DSA-65's 3,293 bytes.
        </p>
        <p>
          That compactness comes at a real implementation cost,
          though, and it is not evenly spread across the algorithm.
          Verification is entirely integer arithmetic, no floating
          point involved at all. Key generation and signing are a
          different matter: signing expands the private key using an
          FFT and an approximate Gaussian sampler, both of which rely
          on floating-point arithmetic, and getting that arithmetic to
          behave identically across implementations matters more here
          than it would elsewhere, since NIST's specification only
          permits randomised signing, not deterministic, precisely
          because a floating-point implementation bug in a
          deterministic scheme could silently produce different
          signatures for the same input, undermining the whole point
          of the check. This is a genuinely live concern rather than a
          theoretical one: a 2025 paper, "Do Not Disturb a Sleeping
          Falcon," demonstrated a real side-channel attack against
          Falcon implementations, which NIST's own validation approach
          and mandatory randomisation are intended to prevent, though
          the field is still actively working through what further
          hardening the final standard should require.
        </p>
        <a
          href="https://eprint.iacr.org/2024/1709.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            Do Not Disturb a Sleeping Falcon: Floating-Point Error
            Sensitivity of the Falcon Sampler and Its Consequences
          </p>
          <p className="article-byline">
            Xiuhan Lin, Mehdi Tibouchi, Yang Yu, Shiduo Zhang -
            EUROCRYPT 2025
          </p>
        </a>
        <PqcSignExample
          variants={FN_DSA_VARIANTS}
          defaultVariant="Falcon-512"
          signAndVerify={signAndVerifyFnDsa}
          toolLabel="liboqs"
        />
      </section>
    </main>
  )
}

export default FnDsa
