import { Link } from 'react-router-dom'
import SymmetricPlaceholder from './SymmetricPlaceholder'
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
        <SymmetricPlaceholder label="CMS padding example" />

        <p>There are other, less commonly used methods:</p>
        <ul>
          <li>Bits</li>
          <li>ZeroLength</li>
          <li>Null</li>
          <li>Space</li>
          <li>Random</li>
        </ul>
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
        <SymmetricPlaceholder label="The ECB-encrypted Linux penguin image" />
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
