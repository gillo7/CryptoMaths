import { Link } from 'react-router-dom'
import { fetchMlDsaSpeed, signAndVerifyMlDsa } from '../lib/pqcDemo'
import PqcSignExample from './PqcSignExample'
import PqcSpeedCompare from './PqcSpeedCompare'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'

const ML_DSA_VARIANTS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const

function MlDsa() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>ML-DSA</h1>

      <section>
        <p>
          ML-DSA has been standardised by NIST as FIPS 204, and is
          currently one of the most efficient PQC signing algorithms.
          FN-DSA (Falcon), FIPS 206, achieves even smaller signatures,
          at the cost of a much harder implementation. SLH-DSA, FIPS
          205, is a completely different, more conservative signature
          scheme, standardised as a deliberate fallback in case the
          lattice-based assumptions ML-DSA and FN-DSA both share are
          ever broken.
        </p>
        <p>
          ML-DSA (based on CRYSTALS-Dilithium) builds on the same
          module-lattice structure as <Link to="/post-quantum-cryptography/ml-kem">ML-KEM</Link>,
          but its signing procedure is fundamentally different in
          shape: it is a Fiat-Shamir-with-Aborts construction, meaning
          the signer may have to restart the entire signing
          computation, potentially several times, before producing an
          output. Key generation samples small secret vectors s₁, s₂
          and a public matrix A, and computes
        </p>
        <div className="code-block">
          <code>t = As₁ + s₂ (mod q)</code>
        </div>
        <p>
          publishing (A, t₁), the high-order bits of t, while the
          low-order bits t₀ are retained with the secret key to keep
          the public key compact. To sign a message M, the signer
          repeats the following loop:
        </p>
        <ol>
          <li>
            Sample a fresh masking vector y, uniformly at random from a
            bounded range [-γ₁, γ₁].
          </li>
          <li>
            Compute w = Ay (mod q), and extract its high-order bits w₁.
          </li>
          <li>
            Derive a challenge polynomial c = H(μ ‖ w₁) with small,
            sparse coefficients, where μ is a hash of the public key
            and message.
          </li>
          <li>Compute the candidate response z = y + cs₁.</li>
          <li>
            Reject and restart from step 1 if ‖z‖<sub>∞</sub> ≥ γ₁ − β,
            or if the low-order bits of Ay − cs₂ would cause a carry
            into the high-order bits that the verifier could not
            reconstruct from z and t₁ alone.
          </li>
        </ol>
        <p>
          Only once step 5's checks pass does the signer output (z, h,
          c), where h is a small hint vector letting the verifier
          reconstruct w₁ from z, c, and the public key without ever
          seeing w itself.
        </p>
        <p>
          The rejection step exists because z = y + cs₁ would otherwise
          leak statistical information about the secret s₁: bounding
          ‖z‖<sub>∞</sub> ensures the distribution of accepted z values
          is (close to) independent of s₁, which is what makes the
          scheme provably secure in the random-oracle model. The
          parameters are chosen so that each attempt succeeds with a
          fixed probability p independent of previous attempts, making
          the number of attempts until the first success a
          geometrically distributed random variable with expectation
          1/p: for ML-DSA's parameter sets, this means several restarts
          are the norm rather than the exception, not an implementation
          defect. Since each restart requires a full matrix-vector
          multiplication and a fresh hash evaluation, and the number of
          restarts varies signature-to-signature by design, wall-clock
          signing time is inherently non-constant, and noticeably more
          variable than a fixed-shape scheme like ECDSA or RSA. This is
          a specification-level property of FIPS 204 itself, not an
          artefact of any particular implementation.
        </p>
        <p>
          ML-DSA is standardised at three parameter sets, corresponding
          to the module dimensions (k, l) of the secret and public
          matrices: ML-DSA-44 (NIST Level 2, comparable to AES-128),
          ML-DSA-65 (Level 3, AES-192), and ML-DSA-87 (Level 5,
          AES-256). As with ML-KEM, larger module dimensions mean
          larger keys and signatures, but the growth here is markedly
          steeper: signature sizes rise from 2,420 bytes at ML-DSA-44
          to 3,293 bytes at ML-DSA-65 and 4,595 bytes at ML-DSA-87,
          roughly triple the largest ML-KEM ciphertext (1,568 bytes for
          ML-KEM-1024), and an order of magnitude larger than an
          Ed25519 signature (64 bytes) or even a 2048-bit RSA-PSS
          signature (256 bytes). That difference is not just a
          bandwidth cost either, every signature has to be generated,
          transmitted, and verified as part of the TLS handshake, so a
          multi-kilobyte signature adds real, measurable overhead to
          every connection compared to the classical alternatives.
        </p>
        <div className="table-scroll-x">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Parameter set</th>
                <th>NIST level</th>
                <th>Comparable to</th>
                <th>Signature size</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ML-DSA-44</td>
                <td>Level 2</td>
                <td>AES-128</td>
                <td>2,420 bytes</td>
              </tr>
              <tr>
                <td>ML-DSA-65</td>
                <td>Level 3</td>
                <td>AES-192</td>
                <td>3,293 bytes</td>
              </tr>
              <tr>
                <td>ML-DSA-87</td>
                <td>Level 5</td>
                <td>AES-256</td>
                <td>4,595 bytes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PqcSignExample
          variants={ML_DSA_VARIANTS}
          defaultVariant="ML-DSA-65"
          signAndVerify={signAndVerifyMlDsa}
        />
        <PqcSpeedCompare
          description="Ed25519, RSA-PSS, and all three ML-DSA parameter sets, signing speed:"
          buttonLabel="Run a live speed test on the server"
          fetchSpeed={fetchMlDsaSpeed}
          note="Every figure below is the median of 25 real runs, not
            just one - at these speeds, a single run is dominated by
            process-spawn overhead rather than the actual signing
            cost. Five algorithms times 25 runs each takes a few
            seconds, the server hasn't stalled."
          loadingHint="Running 125 real signs, a few seconds…"
        />
      </section>
    </main>
  )
}

export default MlDsa
