import { Link } from 'react-router-dom'
import './SymmetricEncryption.css'
import './Hashing.css'

function KeyedConstructions() {
  return (
    <main className="symmetric-page">
      <Link to="/symmetric-encryption" className="back-link">
        ← Back to Symmetric encryption
      </Link>

      <h1>Keyed Constructions</h1>

      <section>
        <h2>HMAC (Hash-based Message Authentication Code)</h2>
        <p>
          <Link to="/symmetric-encryption/block-ciphers/aes">AES</Link>{' '}
          and{' '}
          <Link to="/symmetric-encryption/stream-ciphers/chacha20">
            ChaCha20
          </Link>
          , covered in the previous two sections, both rely on the same
          idea: two parties who already share a secret key. HMAC uses
          that same shared key for a completely different job. It
          doesn't encrypt anything, and it isn't a cipher at all. It
          borrows a hash function as its raw material, the way{' '}
          <Link to="/hashing/bcrypt">Bcrypt</Link> borrowed{' '}
          <Link to="/symmetric-encryption/block-ciphers/blowfish">
            Blowfish's
          </Link>{' '}
          internals in the Hashing chapter, but what it builds with
          that hash is new: a way for someone holding the shared key to
          prove both that a message hasn't been tampered with, and that
          it genuinely came from them.
        </p>
        <p>
          Formally defined by Bellare, Canetti, and Krawczyk in 1996,
          standardised in{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc2104"
            target="_blank"
            rel="noopener noreferrer"
          >
            RFC 2104
          </a>
          . A plain hash proves data hasn't accidentally changed, but
          proves nothing about who produced it, anyone can compute a
          hash of anything, no key required. HMAC fixes that gap by
          mixing the shared secret key into the hashing process itself,
          twice, in a structured way:
        </p>
        <div className="code-block">
          <code>
            HMAC(key, message) = H( (key XOR opad) || H( (key XOR ipad)
            || message ) )
          </code>
        </div>
        <p>
          The key gets combined with the message in an inner hash, then
          that result gets combined with the key again in an outer
          hash. Only someone who knows the secret key can produce a
          valid HMAC tag for a given message, and only someone who
          knows the key can verify it's correct.
        </p>
        <p>
          HMAC is a wrapper, not a fixed algorithm, HMAC-SHA256 and
          HMAC-SHA3 are both in real use today. Genuinely
          counterintuitive point worth knowing: HMAC-MD5 and HMAC-SHA1
          remain considered reasonably secure for authentication even
          though plain MD5 and SHA-1 are broken for collision
          resistance, HMAC's security rests on different properties
          that survived the collision attacks that broke the
          underlying hashes on their own.
        </p>
        <a
          href="https://cseweb.ucsd.edu/~mihir/papers/kmd5.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            Keying Hash Functions for Message Authentication
          </p>
          <p className="article-byline">
            Mihir Bellare, Ran Canetti, Hugo Krawczyk - CRYPTO 1996
          </p>
        </a>
        <p>
          The AES-GCM mode covered in{' '}
          <Link to="/symmetric-encryption/block-ciphers">
            Block Ciphers
          </Link>{' '}
          already builds authentication directly into the cipher
          itself, so it doesn't need HMAC separately. But every cipher
          mode that doesn't do that on its own, and every context where
          a key needs deriving rather than data encrypting, still leans
          on HMAC underneath, which is exactly what the next section
          covers.
        </p>
      </section>

      <section>
        <h2>HKDF (HMAC-based Key Derivation Function)</h2>
        <p>
          Formalised by Hugo Krawczyk in 2010, standardised as{' '}
          <a
            href="https://www.rfc-editor.org/rfc/rfc5869"
            target="_blank"
            rel="noopener noreferrer"
          >
            RFC 5869
          </a>
          . HKDF takes HMAC, the construction covered above, and uses
          it as a building block for a different problem entirely: not
          proving who sent something, but turning one shared secret
          into several usable keys.
        </p>
        <p>
          Sometimes the secret two parties end up with isn't a nice,
          uniformly random, correctly-sized key ready to use directly.
          A shared secret from a{' '}
          <Link to="/key-exchange/diffie-hellman">
            Diffie-Hellman exchange
          </Link>{' '}
          or an{' '}
          <Link to="/post-quantum-cryptography/ml-kem">
            ML-KEM encapsulation
          </Link>
          , covered elsewhere in this app, is cryptographically strong,
          but not necessarily evenly distributed across every bit, and
          usually the wrong size for what actually comes next, maybe a
          256-bit AES key, a separate key for HMAC itself, and an IV,
          all needed from that one shared secret. HKDF turns one blob
          of decent-but-awkward keying material into as many
          well-formed, independent, properly-sized keys as required.
        </p>
        <p>
          The process runs in two steps. <strong>Extract</strong>{' '}
          takes the raw shared secret and, using HMAC with a salt,
          concentrates it into a single, fixed-length, uniformly-strong
          key, cleaning up whatever irregularities existed in the
          input. <strong>Expand</strong> takes that clean key and
          stretches it into however much output keying material is
          needed, often labelling each derived key with what it's
          actually for, so that even several keys pulled from the same
          source secret are cryptographically independent of one
          another, not just copies with different names attached.
        </p>
        <a
          href="https://eprint.iacr.org/2010/264.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            Cryptographic Extraction and Key Derivation: The HKDF
            Scheme
          </p>
          <p className="article-byline">Hugo Krawczyk - CRYPTO 2010</p>
        </a>
        <p>
          This is where the whole chapter actually meets in one place.
          AES and ChaCha20 need a key before they can do anything. HMAC
          needs a key too, and can also help build one. HKDF is the
          mechanism that takes a single shared secret, however it was
          obtained, and turns it into every key the rest of this
          chapter actually runs on. It's the quiet, unglamorous last
          step, run once, every time two parties agree on a secret,
          before any of the ciphers covered above ever encrypt a
          single byte.
        </p>
      </section>
    </main>
  )
}

export default KeyedConstructions
