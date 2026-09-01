import { Link } from 'react-router-dom'
import HqcEncapDecap from './HqcEncapDecap'
import HqcExample from './HqcExample'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'
import './Hashing.css'

function Hqc() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>HQC</h1>

      <section>
        <p>
          Where <Link to="/post-quantum-cryptography/ml-kem">ML-KEM</Link>,{' '}
          <Link to="/post-quantum-cryptography/ml-dsa">ML-DSA</Link> and{' '}
          <Link to="/post-quantum-cryptography/slh-dsa">SLH-DSA</Link> are
          already finished, standardised FIPS documents, HQC is a step
          earlier in the pipeline: NIST selected it as its fifth
          post-quantum algorithm in March 2025, with a finalised
          standard targeted for 2027.
        </p>
        <p>
          HQC exists for a specific, deliberate reason, not because
          ML-KEM is considered weak. NIST's own announcement is
          explicit: HQC is not intended to replace ML-KEM, which
          remains the recommended default for general encryption. It
          is a backup built on entirely different mathematics,
          specifically so that a future weakness discovered in
          lattice-based cryptography would not take down every
          standardised KEM at once. As Dustin Moody, who heads NIST's
          PQC project, put it, the goal is a fallback that rests on a
          different math approach than ML-KEM, so that if ML-KEM ever
          proves vulnerable, there is still something standing.
        </p>
        <a
          href="https://www.nist.gov/news-events/news/2025/03/nist-selects-hqc-fifth-algorithm-post-quantum-encryption"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Official statement - NIST</span>
          <p className="article-title">
            NIST Selects HQC as Fifth Algorithm for Post-Quantum Encryption
          </p>
          <p className="article-byline">NIST, 11 March 2025</p>
          <p className="article-excerpt">
            "Moody said that HQC is a lengthier algorithm than ML-KEM
            and therefore demands more computing resources."
          </p>
        </a>
        <p>
          Where ML-KEM's security rests on Module-LWE, structured
          lattices with small noise defeating exact linear algebra,
          HQC's security rests on error-correcting codes, the same
          field of mathematics used for decades to recover corrupted
          data from noisy transmission. A message is encoded using a
          linear code with a specific, exploitable structure, then
          deliberately mixed with random errors before being sent.
          Someone who knows the private structure can efficiently
          decode through the noise and recover the message; without
          it, recovering the message means solving general syndrome
          decoding, believed to be hard for both classical and quantum
          computers.
        </p>
        <p>
          Like ML-KEM, HQC is standardised at three parameter sets
          matching the same NIST security levels: HQC-128 (Level 1),
          HQC-192 (Level 3), and HQC-256 (Level 5). That security comes
          at a real cost, though. Against ML-KEM-512's 800-byte public
          key, HQC-128 needs roughly 2,241 bytes; against ML-KEM-512's
          768-byte ciphertext, HQC-128 needs roughly 4,433 bytes,
          more than five times larger. Moody's own framing is blunt
          about this: HQC is lengthier than ML-KEM and demands more
          computing resources, but its clean and secure operation was
          what convinced reviewers it was worth the cost as an
          insurance policy.
        </p>
        <table className="ref-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>ML-KEM-512</th>
              <th>HQC-128</th>
              <th>ML-KEM-768</th>
              <th>HQC-192</th>
              <th>ML-KEM-1024</th>
              <th>HQC-256</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Public key</td>
              <td>800 bytes</td>
              <td>2,241 bytes</td>
              <td>1,184 bytes</td>
              <td>4,514 bytes</td>
              <td>1,568 bytes</td>
              <td>7,237 bytes</td>
            </tr>
            <tr>
              <td>Ciphertext</td>
              <td>768 bytes</td>
              <td>4,433 bytes</td>
              <td>1,088 bytes</td>
              <td>8,978 bytes</td>
              <td>1,568 bytes</td>
              <td>14,421 bytes</td>
            </tr>
          </tbody>
        </table>
        <p>
          The HQC figures above are read straight off this server's
          own live demo below, not copied from a spec document -
          exact byte counts have shifted slightly across HQC's several
          revisions, so this is the version actually running here,
          right now.
        </p>
        <HqcExample />
        <HqcEncapDecap />
      </section>
    </main>
  )
}

export default Hqc
