import { Link } from 'react-router-dom'
import PostQuantumPlaceholder from './PostQuantumPlaceholder'
import './PostQuantumCryptography.css'
import './SymmetricEncryption.css'

function MlKem() {
  return (
    <main className="pqc-page">
      <Link to="/post-quantum-cryptography" className="back-link">
        ← Back to Post-Quantum Cryptography
      </Link>

      <h1>ML-KEM</h1>

      <section>
        <p>
          To solve the vulnerability inherent to RSA and Elliptic
          Curves, lattice-based algorithms such as ML-KEM have been
          standardised by NIST. Instead of relying on factorisation of
          prime numbers or points on a curve, they use a polynomial
          ring with small error terms to achieve a small key size and
          an efficient calculation, while still being believed to
          resist attack even from quantum-capable computing.
        </p>
        <p>
          Their security relies on Module Learning With Errors
          (Module-LWE). Without noise, recovering a secret vector s
          from a public matrix A and b = As is ordinary linear algebra,
          solvable instantly by Gaussian elimination. Module-LWE breaks
          that by adding a small random error vector e to every
          equation instead: b = As + e. That small amount of noise is
          enough to defeat exact elimination, while leaving b
          statistically indistinguishable from random to anyone without
          s. No known algorithm, quantum or classical, can recover s
          from these noisy equations efficiently, which is why
          Module-LWE is believed to resist attacks even from Shor's
          algorithm.
        </p>
        <p>
          Buchanan frames the resulting key-encapsulation mechanism
          (KEM) as a straightforward asymmetric exchange: Alice
          generates a public/private key pair and publishes the public
          key; Bob uses it alone to produce a ciphertext; only Alice's
          private key can open that ciphertext and recover the shared
          key Bob chose. This is a different shape of exchange to both
          classical alternatives discussed above. It is not like
          Diffie-Hellman (<Link to="/key-exchange/ecdh">ECDH</Link>,
          X25519): there, Alice and Bob each generate their own key
          pair and independently compute the same shared secret from
          the other's public value, so the secret only exists once both
          sides have acted. A KEM has no such symmetry: Bob alone
          decides the secret and wraps it using Alice's public key, and
          the secret exists the moment he does so, before Alice does
          anything. It is also not like{' '}
          <Link to="/public-key-encryption">RSA's</Link> public-key
          envelope, which directly encrypts an arbitrary message via
          modular exponentiation: here, Bob's ciphertext is built
          entirely out of noisy Module-LWE equations, so only Alice's
          private key can perform the cancellation that recovers the
          shared secret. The concrete construction below makes that
          cancellation explicit.
        </p>
        <p>
          The underlying encryption scheme that ML-KEM is built from
          works over the polynomial ring R<sub>q</sub> = Z<sub>q</sub>
          [x] / (x&#8319; + 1), with n = 256 and q = 3329. A private key
          is a small vector of k polynomials, s in R<sub>q</sub>&#7472;,
          sampled from a centred binomial distribution so its
          coefficients are small. Key generation produces a public
          matrix A in R<sub>q</sub><sup>k&times;k</sup> (derived from a
          public random seed, so it never needs to be transmitted) and
          computes the noisy LWE output introduced above, written t in
          ML-KEM's own notation rather than the generic b used earlier:
        </p>
        <div className="code-block">
          <code>t = As + e (mod q)</code>
        </div>
        <p>
          where e is a second small error vector; the public key is (A,
          t). Encapsulation samples fresh small vectors r, e1 and a
          small error polynomial e2, and computes
        </p>
        <div className="code-block">
          <code>
            u = Aᵀr + e1{'\n'}v = tᵀr + e2 + Encode(m)
          </code>
        </div>
        <p>sending (u, v) as the ciphertext. Decapsulation recovers the encoded message via</p>
        <div className="code-block">
          <code>v - sᵀu = e2 - sᵀe1 + eᵀr + Encode(m) ≈ Encode(m)</code>
        </div>
        <p>
          since every term except Encode(m) is a sum of small errors
          that rounds away cleanly, while an attacker without s sees
          only values indistinguishable from uniform noise. ML-KEM
          itself adds a re-encryption check on top of this core to
          protect against active, chosen-ciphertext attacks rather than
          just passive eavesdropping.
        </p>
        <p>
          Every one of those steps (As, Aᵀr, tᵀr, sᵀu) is a polynomial
          multiplication in R<sub>q</sub>, and how cheaply that
          multiplication can be done is where ML-KEM's
          architecture-agnostic performance comes from. Multiplied the
          direct way, two polynomials with n terms each cost O(n²)
          operations: every coefficient of the first against every
          coefficient of the second, the same reason multiplying two
          long numbers by hand is slow. R<sub>q</sub> is constructed
          specifically to avoid this using the Number Theoretic
          Transform (NTT), the same trick behind the Fast Fourier
          Transform: instead of representing a polynomial by its n
          coefficients, temporarily represent it by its value at n
          specially chosen points. In that representation, multiplying
          two polynomials collapses to multiplying their values point
          by point, with no cross-terms left to compute.
        </p>
        <p>
          Getting into and out of that representation is the NTT
          itself, built from a repeated basic step called a butterfly:
          take two values, multiply one of them by a fixed pre-computed
          constant, then output their sum and their difference. The
          algorithm reaches all n values by repeatedly splitting the
          problem in half, the same divide-and-conquer idea behind
          merge sort or a knockout tournament bracket: halving n=256
          down to pairs takes log₂(256)=8 stages, each doing n/2=128
          butterflies. That totals O(n log n) operations, far fewer
          than the O(n²) of direct multiplication.
        </p>
        <p>
          The reason this matters for constant-time implementation is
          that every butterfly performs the exact same sequence of
          operations, touching the exact same memory offsets, regardless
          of what the actual numbers are. There is no data-dependent
          branching of the kind that has historically crept into RSA's
          modular exponentiation or elliptic-curve scalar multiplication,
          and nothing for a particular architecture to be missing: NTT
          cost tracks n log n integer operations and clock speed, and
          nothing else. This is not incidental: the Kyber design team
          note explicitly that the NTT was chosen in part because
          polynomial multiplication in R<sub>q</sub> needs no additional
          temporary storage on embedded platforms, while remaining
          efficiently vectorisable on larger processors, so the same
          arithmetic structure that is lightweight on a microcontroller
          scales cleanly upward.
        </p>
        <p>
          ML-KEM is standardised at three parameter sets, distinguished
          by the module rank k, the dimension of the vectors and matrix
          above, which sets the security level:
        </p>
        <table className="ref-table">
          <thead>
            <tr>
              <th>Module rank</th>
              <th>Name</th>
              <th>NIST level</th>
              <th>Comparable to</th>
              <th>Public key</th>
              <th>Private key</th>
              <th>Ciphertext</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>k = 2</td>
              <td>ML-KEM-512</td>
              <td>Level 1</td>
              <td>AES-128</td>
              <td>800 bytes</td>
              <td>1,632 bytes</td>
              <td>768 bytes</td>
            </tr>
            <tr>
              <td>k = 3</td>
              <td>ML-KEM-768</td>
              <td>Level 3</td>
              <td>AES-192</td>
              <td>1,184 bytes</td>
              <td>2,400 bytes</td>
              <td>1,088 bytes</td>
            </tr>
            <tr>
              <td>k = 4</td>
              <td>ML-KEM-1024</td>
              <td>Level 5</td>
              <td>AES-256</td>
              <td>1,568 bytes</td>
              <td>3,168 bytes</td>
              <td>1,568 bytes</td>
            </tr>
          </tbody>
        </table>
        <p>
          Increasing k means more polynomials per key and per
          ciphertext, so both key and ciphertext size grow with it, as
          the table above shows.
        </p>
        <PostQuantumPlaceholder label="Real ML-KEM keygen via OpenSSL, live .pem output" />
        <PostQuantumPlaceholder label="Benchmark: ML-KEM vs RSA vs P-256 vs X25519 keygen speed" />
      </section>
    </main>
  )
}

export default MlKem
