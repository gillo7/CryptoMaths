import { Link } from 'react-router-dom'
import CmsPaddingExplorer from './CmsPaddingExplorer'
import { blockCipherAlgorithms } from './blockCipherAlgorithms'
import './SymmetricEncryption.css'

function BlockCiphers() {
  return (
    <main className="symmetric-page">
      <Link to="/symmetric-encryption" className="back-link">
        ← Back to Symmetric encryption
      </Link>

      <h1>Block Ciphers</h1>

      <section>
        <h2>Overview</h2>
        <p>
          A block cipher takes plaintext and splits it into fixed-size
          chunks, blocks, then scrambles each block using the key, through
          a series of mathematical operations run repeatedly in rounds.
          The block size and the number of rounds vary by algorithm, but
          the core idea stays the same: transform a fixed amount of data
          at a time, then reassemble the blocks in order to produce the
          full ciphertext. Decryption reverses the process, running the
          same operations backward using the same key.
        </p>
        <p>
          This chunk based approach is what makes block ciphers efficient
          and predictable to implement in both software and hardware, but
          it also creates two problems every block cipher has to solve.
          Real data rarely divides evenly into whole blocks, so something
          has to handle the leftover bytes, this is padding, covered next.
          And encrypting many blocks under the same key raises the
          question of how those blocks relate to each other, which is
          where modes of operation come in later in this section.
        </p>
      </section>

      <section>
        <h2>Initialisation Vectors (IV)</h2>
        <p>
          Most modes of operation (covered later in this section) also need
          an IV, an initialisation vector: a random, non-secret value mixed
          in alongside the key so that encrypting the same plaintext twice,
          even under the same key, produces different ciphertext each time.
          It doesn't need to stay hidden, only be unique per encryption, and
          it's typically sent alongside the ciphertext itself rather than
          kept secret like the key. If that sounds familiar, it's playing
          almost the same role a salt plays for hashes: stopping identical
          inputs from producing identical, pattern-leaking outputs.
        </p>
      </section>

      <section>
        <h2>Padding</h2>
        <p>
          Why does this matter? If blocks of smaller size appear in a
          large enough cipher, a deterministic pattern recognising
          analysis will eventually be able to decipher it. The only way to
          avoid this attack is to use padding.
        </p>

        <p>
          <strong>Padding methods.</strong> CMS (cryptographic message
          syntax) is the most commonly used
          technique. It pads the block with the same value as the number
          of padding bytes needed:
        </p>
        <CmsPaddingExplorer />

        <p>
          There are other, less commonly used methods. Here's what each one
          produces for the same case, 3 bytes of padding needed:
        </p>
        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>How it pads</th>
                <th>Example</th>
                <th>Trade-off</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CMS / PKCS#7</td>
                <td>Every padding byte equals the padding length</td>
                <td>
                  <code>03 03 03</code>
                </td>
                <td>Unambiguous, binary-safe - the default almost everywhere today</td>
              </tr>
              <tr>
                <td>Bits (ISO/IEC 7816-4)</td>
                <td>
                  Append <code>0x80</code>, then zero-fill the rest
                </td>
                <td>
                  <code>80 00 00</code>
                </td>
                <td>Unambiguous, binary-safe</td>
              </tr>
              <tr>
                <td>ZeroLength (ANSI X9.23)</td>
                <td>Zero-fill, but the last byte holds the padding length</td>
                <td>
                  <code>00 00 03</code>
                </td>
                <td>Unambiguous, binary-safe</td>
              </tr>
              <tr>
                <td>Null (zero padding)</td>
                <td>Zero-fill, with no length marker at all</td>
                <td>
                  <code>00 00 00</code>
                </td>
                <td>
                  Ambiguous if the real data itself ends in zero bytes
                </td>
              </tr>
              <tr>
                <td>Space</td>
                <td>
                  Fill with ASCII space (<code>0x20</code>)
                </td>
                <td>
                  <code>20 20 20</code>
                </td>
                <td>Only sensible for text data, not general binary</td>
              </tr>
              <tr>
                <td>Random (ISO 10126)</td>
                <td>Random filler bytes, last byte holds the padding length</td>
                <td>
                  <code>a4 f1 03</code> (random each time, only the last
                  byte is fixed)
                </td>
                <td>
                  Unambiguous, though the randomness adds no real security
                  benefit over ANSI X9.23
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p>Here are some of the main historical and current algorithms used:</p>
        <div className="algo-grid">
          {blockCipherAlgorithms.map((algo) => (
            <Link
              key={algo.slug}
              to={`/symmetric-encryption/block-ciphers/${algo.slug}`}
              className="algo-button"
            >
              {algo.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Modes of Operation</h2>
        <p>
          A block cipher on its own only knows how to scramble one
          fixed-size block. Real messages are longer than that, so a mode
          of operation decides how to chain many blocks together into a
          full encrypted message. These modes are not specific to AES,
          they apply to any block cipher, but AES is the running example
          here since it is what you will actually use them with.
        </p>
        <p>
          <strong>ECB (Electronic Codebook)</strong> is the simplest
          possible mode, and the one to avoid. Each block is encrypted
          completely independently, using the same key, with no connection
          to any other block. The problem is that identical plaintext
          blocks always produce identical ciphertext blocks. Encrypt an
          image using ECB and the outline of the original picture often
          remains clearly visible in the encrypted version, this is the
          famous ECB penguin, the single most effective illustration in
          all of applied cryptography for why encryption alone does not
          guarantee confidentiality if it is used carelessly.
        </p>
        <figure className="figure">
          <img
            src="/images/ecb-penguin.jpg"
            alt="The Linux Tux penguin logo, next to the same image encrypted
              with AES in ECB mode (the outline is still clearly visible),
              next to the same image encrypted with a proper mode (pure
              noise)"
          />
          <figcaption>source: Wikipedia</figcaption>
        </figure>
        <p>
          <strong>CBC, CFB, and OFB</strong> were the historical fixes.
          Each one chains blocks together, feeding information from one
          block into the encryption of the next, so identical plaintext
          blocks no longer produce identical ciphertext. They solved ECB's
          pattern-leaking problem but still only provide confidentiality,
          not integrity, nothing stops an attacker from tampering with the
          ciphertext undetected.
        </p>
        <p>
          <strong>CTR</strong> turns a block cipher into something that
          behaves like a stream cipher, encrypting a counter value instead
          of the data directly and combining the result with the
          plaintext. It is fast and parallelisable, but has the same
          integrity gap as CBC, CFB, and OFB.
        </p>
        <p>
          <strong>GCM (Galois/Counter Mode)</strong> is the current
          standard, and the mode actually used throughout modern TLS. It
          combines CTR mode's encryption with a built-in authentication
          tag, so it provides both confidentiality and integrity in one
          pass, tampering is detected automatically rather than silently
          succeeding. This is what closes the gap every earlier mode left
          open, and it is why GCM, not any of the others, is the
          recommended default today.
        </p>
      </section>
    </main>
  )
}

export default BlockCiphers
