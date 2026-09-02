import { Link } from 'react-router-dom'
import {
  fetchFrodoKemSpeed,
  frodoKemEncapAndDecap,
  generateFrodoKemKeypair,
} from '../lib/pqcDemo'
import KemHexEncapDecap from './KemHexEncapDecap'
import KemHexExample from './KemHexExample'
import PqcSpeedCompare from './PqcSpeedCompare'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'
import './Hashing.css'

const FRODOKEM_VARIANTS = [
  'FrodoKEM-640-AES', 'FrodoKEM-640-SHAKE',
  'FrodoKEM-976-AES', 'FrodoKEM-976-SHAKE',
  'FrodoKEM-1344-AES', 'FrodoKEM-1344-SHAKE',
] as const

function FrodoKem() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>FrodoKEM</h1>

      <section>
        <p>
          FrodoKEM was one of the original NIST Round 3 candidates for
          standardisation, but was not selected, NIST chose the
          structured, lattice-based{' '}
          <Link to="/post-quantum-cryptography/ml-kem">ML-KEM</Link>{' '}
          (Kyber) instead. That "loss" is precisely why FrodoKEM has
          continued to matter since: rather than fading away, it has
          been adopted independently, ISO standardised it in 2026,
          Germany's BSI and the European Union Agency for
          Cybersecurity both recommend it, and the reason given is
          always the same, it rests on deliberately conservative,
          unstructured mathematics that ML-KEM does not.
        </p>
        <p>
          Where ML-KEM's security comes from Module-LWE, structured
          lattices built from polynomial rings, FrodoKEM strips that
          structure away entirely and works with plain, generic
          matrices instead, "taking the ring off," in the words of the
          team's own original paper title. That structure is exactly
          what makes ML-KEM fast, but it is also, in principle, an
          extra mathematical assumption an attacker could someday find
          a way to exploit. FrodoKEM's whole design philosophy is
          refusing that trade: less efficient, but resting on nothing
          beyond the plain Learning With Errors problem itself,
          decades-old, extremely well-studied, with no algebraic
          shortcuts built in for either side to exploit.
        </p>
        <p>
          Key generation produces a public matrix A and a private
          matrix s, then computes
        </p>
        <div className="code-block">
          <code>B = As + e (mod q)</code>
        </div>
        <p>
          the same noisy LWE construction that underlies ML-KEM, just
          over unstructured matrices rather than polynomial rings. To
          encapsulate a shared secret, Bob samples fresh small values
          s₁, e₁, e₂, computes
        </p>
        <div className="code-block">
          <code>
            b₁ = As₁ + e₁{'\n'}v₁ = Bs₁ + e₂
          </code>
        </div>
        <p>and sends both back to Alice. Alice recovers the shared secret via</p>
        <div className="code-block">
          <code>m = v₁ − b₁s</code>
        </div>
        <p>
          the noise terms cancelling out the same way they do in
          ML-KEM's own decapsulation, leaving only a small residual
          error that rounds away cleanly.
        </p>
        <p>
          That refusal to use structure has a real, measurable cost.
          FrodoKEM-640-SHAKE, matching ML-KEM-512's security level,
          produces a public key of 9,616 bytes and a private key of
          19,888 bytes, against ML-KEM-512's 800 and 1,632 bytes,
          roughly twelve times larger. This is the direct trade
          FrodoKEM makes: dramatically larger keys and ciphertexts, in
          exchange for security resting on nothing but the plainest
          possible version of the underlying hard problem.
        </p>
        <div className="table-scroll-x">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>ML-KEM-512</th>
                <th>FrodoKEM-640</th>
                <th>ML-KEM-768</th>
                <th>FrodoKEM-976</th>
                <th>ML-KEM-1024</th>
                <th>FrodoKEM-1344</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Public key</td>
                <td>800 bytes</td>
                <td>9,616 bytes</td>
                <td>1,184 bytes</td>
                <td>15,632 bytes</td>
                <td>1,568 bytes</td>
                <td>21,520 bytes</td>
              </tr>
              <tr>
                <td>Private key</td>
                <td>1,632 bytes</td>
                <td>19,888 bytes</td>
                <td>2,400 bytes</td>
                <td>31,296 bytes</td>
                <td>3,168 bytes</td>
                <td>43,088 bytes</td>
              </tr>
              <tr>
                <td>Ciphertext</td>
                <td>768 bytes</td>
                <td>9,752 bytes</td>
                <td>1,088 bytes</td>
                <td>15,792 bytes</td>
                <td>1,568 bytes</td>
                <td>21,696 bytes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The FrodoKEM figures above (SHAKE variant) are read straight
          off this server's own live demo below, not copied from a
          spec document.
        </p>
        <p>
          FrodoKEM offers two variants for the matrix-generation step,
          an AES-based version that benefits from AES-NI hardware
          acceleration where available, and a SHAKE-based version that
          performs better on hardware without it, worth noting given
          this chapter's own recurring theme of hardware-dependent
          performance in{' '}
          <Link to="/symmetric-encryption">Symmetric Encryption's</Link>{' '}
          AES-NI story. It is standardised at three security levels,
          FrodoKEM-640, -976 and -1344, matching AES-128, AES-192 and
          AES-256 respectively, the same level structure as ML-KEM's
          own three parameter sets.
        </p>
        <a
          href="https://frodokem.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Official site</span>
          <p className="article-title">FrodoKEM</p>
        </a>
        <KemHexExample
          variants={FRODOKEM_VARIANTS}
          defaultVariant="FrodoKEM-640-SHAKE"
          generateKeypair={generateFrodoKemKeypair}
          buttonLabel="Generate a real FrodoKEM keypair"
          note="not OpenSSL, which has no FrodoKEM support at all
            despite its ISO standardisation."
        />
        <KemHexEncapDecap
          variants={FRODOKEM_VARIANTS}
          defaultVariant="FrodoKEM-640-SHAKE"
          encapAndDecap={frodoKemEncapAndDecap}
          description="The same encapsulate/decapsulate exchange as
            ML-KEM's, just built on plain, unstructured matrices
            instead of polynomial rings: Bob encapsulates against
            Alice's public key, Alice decapsulates the resulting
            ciphertext with her private key, and both sides should
            arrive at the identical secret without ever transmitting
            it directly."
          buttonLabel="Encapsulate and decapsulate for real"
        />
        <PqcSpeedCompare
          description="ML-KEM vs FrodoKEM (SHAKE variant), keygen speed at matching NIST security levels:"
          buttonLabel="Run a live speed test on the server"
          fetchSpeed={fetchFrodoKemSpeed}
          note="Every figure below is the median of 25 real runs, not
            just one - at these speeds, a single run is dominated by
            process-spawn overhead rather than the actual keygen cost.
            FrodoKEM's unstructured matrices are the one place on this
            page where the cost of refusing algebraic structure should
            show up as a real, visible gap rather than noise."
          loadingHint="Running 150 real keygens, a few seconds…"
        />
      </section>
    </main>
  )
}

export default FrodoKem
