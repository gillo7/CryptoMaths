import { Link } from 'react-router-dom'
import PublicKeyPlaceholder from './PublicKeyPlaceholder'
import './PublicKeyEncryption.css'
// Shared widget classes (.explorer, .compute-button, .multibox, etc.) and
// the article-preview link classes live in these two lessons' stylesheets
// already - reused here rather than duplicated, since neither is scoped to
// its own page.
import './SymmetricEncryption.css'
import './Hashing.css'

function PublicKeyEncryption() {
  return (
    <main className="public-key-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Public Key Encryption</h1>

      <section>
        <p>
          Diffie and Hellman published the conceptual breakthrough of
          public-key cryptography in 1976, "New Directions in Cryptography",
          and in 1977, Ron Rivest, Adi Shamir and Len Adleman published the
          first practical implementation of the idea, "A Method for
          Obtaining Digital Signatures and Public-Key Cryptosystems".
          Together, their legacy would change internet exchanges forever.
        </p>

        <a
          href="/articles/new-directions-in-cryptography.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">New Directions in Cryptography</p>
          <p className="article-byline">
            Whitfield Diffie, Martin E. Hellman - IEEE Transactions on
            Information Theory, 1976
          </p>
          <p className="article-excerpt">
            "We stand today on the brink of a revolution in cryptography."
          </p>
        </a>
        <a
          href="/articles/rsa-paper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">
            A Method for Obtaining Digital Signatures and Public-Key
            Cryptosystems
          </p>
          <p className="article-byline">
            R. L. Rivest, A. Shamir, L. Adleman - MIT Laboratory for
            Computer Science, 1977
          </p>
          <p className="article-excerpt">
            "An encryption method is presented with the novel property
            that publicly revealing an encryption key does not thereby
            reveal the corresponding decryption key."
          </p>
        </a>

        <p>
          They came up with a simple, yet powerful idea: the main downside
          of traditional symmetric encryption is that a single key must be
          shared between two parties. Anyone intercepting the key can
          therefore decrypt any data exchanged. They came up with the idea
          that if Alice and Bob instead generated two keys, a public one
          and a private one, they could solve the issue of sharing
          information and the key and keeping it safe from Eve, the
          malevolent unwanted spy.
        </p>
        <p>
          How does it work? Let's describe it as a scenario: Alice wants to
          send Bob a very private message. They both create a key-pair: a
          public key, meant to be shared with everyone, and a private key,
          which by definition, must remain absolutely private and only
          known by its owner. Once both parties have a key-pair ready,
          Alice, the instigator of the very private message, asks Bob for
          his public key. Bob can send it freely, it is public after all.
          And with this key, Alice encrypts the very private message. Now,
          she can send the ciphertext back to Bob. And only Bob, with his
          own private key, can decrypt the message that was encrypted with
          his own public key. If Eve was to intercept the conversation, she
          would not be able to read it: Bob's public key, and Alice's
          message encrypted with it, are useless if she does not possess
          Bob's private key!
        </p>
        <p>
          But Eve is determined. And she plots a plan: what if she sent a
          message to Bob pretending to be Alice? She could forge a very
          private message, and fool Bob into revealing his secrets to her!
          But Alice is smarter than Eve. She has signed her message. Using
          her own private key, she took a hash of the message. And Bob, who
          is always wary of Eve's mischievousness, knows that if he uses
          Alice's public key to check the hash, he'll be able to assert
          that only Alice could've written it, since it would only match
          her very own private key that she has never shared with anyone.
          Eve's plot is in tatters, Bob and Alice can communicate privately
          at will now. Thanks to RSA.
        </p>
        <p>
          This is the underlying idea of the RSA method, which
          revolutionised digital communications ever since, and still to
          this day are the core building blocks of online security.
        </p>
        <p>
          And this links also to our{' '}
          <Link to="/symmetric-encryption">symmetric encryption</Link>{' '}
          section. Public-key encryption methods like RSA were never meant
          to encrypt data at bulk, they're far too inefficient for it. But
          they're particularly suited to sharing 128 to 256 bits of
          information, the AES shared key which then can decrypt their
          entire conversation, for example.
        </p>
        <p>
          RSA was the seminal idea, but it is rather slow, and very large
          key-size must be used (2048-bits to 4096-bits) to keep it secure.
          For added efficiency, and to reduce key-size, Elliptic Curves
          were found to be just as efficient. And as a final note for this
          introduction, both RSA and Elliptic Curves are now considered at
          risk: a CRQC (Cryptographically-Relevant-Quantum-Computer), in
          the very foreseeable future may leverage Shor's algorithm to
          break both, all concepts that you'll find explored much further
          in the{' '}
          <Link to="/post-quantum-cryptography">
            Post-Quantum Cryptography
          </Link>{' '}
          section.
        </p>
      </section>

      <section>
        <h2>RSA in practice</h2>

        <p>The key generation process, in full:</p>
        <PublicKeyPlaceholder label="Step-by-step RSA key generation demo via the OpenSSL backend" />

        <p>
          Two prime numbers, p and q, are chosen and multiplied to produce
          N. Their security relies entirely on how they were chosen, big
          and genuinely random, since N being difficult to factor back into
          p and q is the whole foundation RSA rests on. Factoring a small
          number like 33 back into 3 and 11 takes seconds by hand,
          factoring a real 2048-bit N back into its two prime factors is,
          with current computers and mathematics, considered infeasible,
          that gap between "trivial to multiply forward" and "infeasible
          to factor backward" is the entire security guarantee RSA
          provides.
        </p>
        <p>
          From p and q, PHI, Euler's totient of N, is calculated:
          (p-1)(q-1). An encryption exponent e is chosen, sharing no common
          factor with PHI. Together, e and N form the public key. The
          private exponent d is then found as the modular inverse of e
          with respect to PHI, satisfying (d × e) mod PHI = 1, together
          with N, d forms the private key.
        </p>

        <p>
          Worked example, using deliberately tiny numbers purely so the
          maths stays checkable by hand, real RSA keys use primes hundreds
          of digits long, never anything this small:
        </p>
        <div className="code-block">
          <code>
            p = 3, q = 11{'\n'}
            N = p × q = 33{'\n'}
            PHI = (p-1)(q-1) = 2 × 10 = 20{'\n'}
            e = 3 (shares no common factor with 20){'\n'}
            Public key: [e, N] = [3, 33]{'\n'}
            d = 7, found by solving (d × 3) mod 20 = 1,{'\n'}
            {'  '}since (7 × 3) mod 20 = 21 mod 20 = 1{'\n'}
            Private key: [d, N] = [7, 33]
          </code>
        </div>
        <p>
          To encrypt a message M, C = Mᵉ mod N. To decrypt, M = C^d mod N.
        </p>
        <PublicKeyPlaceholder label="Interactive encrypt/decrypt calculator using this worked example, with selectable values, live" />
        <p>
          Taking M = 5: C = 5³ mod 33 = 125 mod 33 = 26. Decrypting: M =
          26⁷ mod 33 = 5, the original message recovered. One crucial rule
          makes this work at all: M must be smaller than N. Above that
          ceiling, RSA's modular arithmetic loses information, M and M+N
          would encrypt identically, so the message becomes unrecoverable.
          This is exactly why real key sizes matter so much, a 2048-bit N
          gives enormous room to encrypt genuinely large values, while this
          toy N of 33 can only ever handle single-digit messages.
        </p>
        <p>
          In practice, e is almost always 65537 (0x10001 in hexadecimal), a
          specific, deliberate choice, not a random pick. In binary it has
          only two bits set, which makes the repeated squaring used during
          encryption fast, while still being large enough to avoid attacks
          that exploit very small exponents. RSA implementations compute
          the modular exponentiation itself using Python's{' '}
          <code>pow(m, e, n)</code> or equivalent, calculating{' '}
          <code>m^e mod n</code> directly without ever building the full,
          astronomically large intermediate value <code>m^e</code> first.
        </p>
        <PublicKeyPlaceholder label="Live pow(m, e, n) vs naive m**e % n timing comparison, showing why the efficient method matters" />

        <p>
          RSA keys generated in the real world, via OpenSSL, are stored and
          shared in the .pem format, Base64-encoded text wrapped around the
          underlying binary key data, the same Base64 encoding covered in
          this app's own <Link to="/encoding">Encoding</Link> chapter.
        </p>
        <PublicKeyPlaceholder label="Live OpenSSL RSA key generation, showing the actual .pem output" />

        <p>
          RSA with small key values is trivial to break, even my small
          Raspberry Pi server can make short work of a 56-bit key:
        </p>
        <PublicKeyPlaceholder label="RSA breaker for a 56-bit key" />

        <p>
          This is why RSA's security is directly dependent on its
          key-size, with the downside that it makes it very slow.
        </p>
        <PublicKeyPlaceholder label="RSA's speed test vs ECC" />

        <p>
          So what is a more efficient way to achieve 2048-bit RSA security
          but keep a 256-bit key? Elliptic curve cryptography, most of
          which you'll meet properly in the next chapter,{' '}
          <Link to="/key-exchange">Key Exchange</Link>, where curves do
          their real-world heavy lifting.
        </p>
      </section>
    </main>
  )
}

export default PublicKeyEncryption
