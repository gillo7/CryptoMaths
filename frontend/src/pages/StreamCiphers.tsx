import { Link } from 'react-router-dom'
import { streamCipherAlgorithms } from './streamCipherAlgorithms'
import './SymmetricEncryption.css'

function StreamCiphers() {
  return (
    <main className="symmetric-page">
      <Link to="/symmetric-encryption" className="back-link">
        ← Back to Symmetric encryption
      </Link>

      <h1>Stream Ciphers</h1>

      <section>
        <h2>Overview</h2>
        <p>
          A stream cipher does not work in fixed chunks at all. Instead of
          splitting data into blocks, it generates a continuous stream of
          pseudorandom bytes, called a key stream, derived from the secret
          key, and combines that key stream with the plaintext one byte
          or even one bit at a time, almost always using XOR. Encryption
          and decryption become the same operation: XOR the data with the
          key stream once to encrypt, XOR the result with the same key
          stream again to decrypt.
        </p>
        <p>
          This has real, practical consequences. There is no block size
          to worry about, so no padding is needed, and no awkward
          leftover bytes at the end of a message. A stream cipher can
          encrypt data of any length, one byte as it arrives, which makes
          it a natural fit for continuous, real time data such as audio
          or video streams, where waiting to fill a whole block before
          encrypting would introduce a delay. The trade-off is that a
          stream cipher's entire security rests on the key stream itself,
          if the same key stream is ever reused, or if it turns out to be
          statistically predictable rather than genuinely random-looking,
          the cipher breaks. Every cipher in this section, RC4's downfall
          through biased output, and Salsa20 and ChaCha20's deliberate
          engineering to avoid exactly that fate, comes back to this one
          central requirement.
        </p>
      </section>

      <section>
        <div className="algo-grid">
          {streamCipherAlgorithms.map((algo) => (
            <Link
              key={algo.slug}
              to={`/symmetric-encryption/stream-ciphers/${algo.slug}`}
              className="algo-button"
            >
              {algo.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export default StreamCiphers
