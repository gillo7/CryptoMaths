import { Link } from 'react-router-dom'
import { fetchSlhDsaSpeed, signAndVerifySlhDsa } from '../lib/pqcDemo'
import PqcSignExample from './PqcSignExample'
import PqcSpeedCompare from './PqcSpeedCompare'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'

const SLH_DSA_VARIANTS = [
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256s',
  'SLH-DSA-SHAKE-256f',
] as const

function SlhDsa() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>SLH-DSA</h1>

      <section>
        <p>
          SLH-DSA has been standardised by NIST as FIPS 205, and rests
          on a completely different foundation to{' '}
          <Link to="/post-quantum-cryptography/ml-kem">ML-KEM</Link> and{' '}
          <Link to="/post-quantum-cryptography/ml-dsa">ML-DSA</Link>:
          rather than the hardness of Module-LWE, its security depends
          solely on the collision and preimage resistance of the
          underlying hash function, with no lattice or other structured
          mathematical assumption to break. Originally proposed by
          Bernstein et al. in 2015 as SPHINCS+, this makes it the most
          conservative of NIST's post-quantum signature standards, and
          also the most computationally expensive.
        </p>
        <p>
          SLH-DSA is built from three hash-based components, layered on
          top of each other. WOTS+ (a strengthened Winternitz one-time
          signature scheme) signs a single value once and can never be
          safely reused for a second message. FORS (Forest of Random
          Subsets) extends this to a few-time signature, letting a
          small number of messages be signed from the same key
          material. A hypertree, a tree of Merkle trees stacked on top
          of each other, then links many WOTS+ instances together under
          a single public key: the tree's root, computed by repeatedly
          hashing pairs of child nodes up to a single value, becomes
          the public key. To sign, the message is bound through FORS,
          that FORS output is signed by a WOTS+ key at a leaf of the
          hypertree, and the resulting signature carries the
          authentication path proving that leaf really does belong to
          the tree rooted at the public key.
        </p>
        <p>
          This structure is entirely stateless: unlike its predecessor
          XMSS, which had to track which leaf of the tree had already
          been used and could fail catastrophically if that state was
          ever lost or reused, SLH-DSA derives which leaf to sign from
          each time directly from the message and a fresh random value,
          with no persistent signing state to manage at all.
        </p>
        <p>
          The signature itself is large precisely because it has to
          carry proof of this whole structure: the FORS signature, the
          WOTS+ signature, and the authentication path connecting them
          up through every layer of the hypertree, rather than a single
          compact value the way ML-DSA's z, h, c triple is. This is
          also, directly, why its timing behaves so differently to
          ML-DSA's. ML-DSA's signing loop rejects and restarts a
          variable number of times depending on the specific message
          and randomness involved, which is exactly why its signing
          time carries real variance. SLH-DSA has no such rejection
          step: every signature walks the same fixed number of WOTS+
          chains and the same fixed hypertree height, regardless of the
          message or the key. The computational cost is entirely
          deterministic, driven purely by how many hash operations that
          fixed structure requires.
        </p>
        <p>
          That fixed cost is severe, though, precisely because of how
          large the hypertree height and the individual WOTS+/FORS
          parameters need to be to reach a given security level using
          nothing but hash function assumptions. SLH-DSA-SHAKE-256s, one
          of its largest parameter sets, produces a signature of
          roughly 29,798 bytes, more than six times ML-DSA-87's largest
          signature, and this size, not clock speed or architecture, is
          the direct cause of the multi-minute signing times SLH-DSA is
          known for on constrained hardware.
        </p>
        <PqcSignExample
          variants={SLH_DSA_VARIANTS}
          defaultVariant="SLH-DSA-SHAKE-256s"
          signAndVerify={signAndVerifySlhDsa}
        />
        <PqcSpeedCompare
          description="Ed25519, ML-DSA-65, and all four SLH-DSA-SHAKE parameter sets, signing speed:"
          buttonLabel="Run a live speed test on the server"
          fetchSpeed={fetchSlhDsaSpeed}
        />
      </section>
    </main>
  )
}

export default SlhDsa
