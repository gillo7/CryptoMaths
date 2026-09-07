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
    </main>
  )
}

export default KeyedConstructions
