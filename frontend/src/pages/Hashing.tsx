import { Link } from 'react-router-dom'
import { hashingAlgorithms } from './hashingAlgorithms'
import HashExplorer from './HashExplorer'
import './Hashing.css'

function Hashing() {
  return (
    <main className="hashing-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Hashing</h1>

      <section>
        <p>
          Hashing is to get a "fingerprint" of any amount of data and be
          able to create a fixed-length hash, a string of mangled data,
          historically a technique found by Prof. Ron Rivest. We speak also
          of a "one-way encryption". Ideally, it is impossible to revert to
          the original data once it has been hashed. The only way to find a
          hash is to use the same original data and the same hashing
          technique to get the same hash. Changing a single character
          changes the hash completely. This is why passwords are kept in
          hashes form, no mathematical way to reverse find it. Hashes are
          also fundamental to Signatures and Certificates.
        </p>

        <HashExplorer />
      </section>

      <section>
        <h2>Salting</h2>
        <p>
          Salt is adding a string onto the input data before hashing, it
          increases the range of signatures. It makes it extremely
          difficult to pre-compute a rainbow table (a table containing
          pre-computed hashes, which allows for a very quick search through
          them for a corresponding string). When passwords are stored,
          they are stored with the salt.
        </p>

        <p>Examples of salt:</p>

        <p>
          <strong>Linux - /etc/shadow:</strong>
        </p>
        <p className="code-block">
          <code>
            olivier:$6$Kx7QvL2p$rJ4mZ9wYbT1nA6qE3sD8uH0jV5xC7oP2lI9kG4fN6rM1yB8zW3vX5tS0uQ7wR2eK4h:19876:0:99999:7:::
          </code>
        </p>
        <ul>
          <li>
            <code>$6$</code> - algorithm ID (<code>$1$</code> = MD5,{' '}
            <code>$5$</code> = SHA-256, <code>$6$</code> = SHA-512)
          </li>
          <li>
            <code>Kx7QvL2p</code> - the salt, randomly generated per user
          </li>
          <li>
            <code>rJ4mZ9…eK4h</code> - the resulting hash
          </li>
          <li>
            everything after the second colon is account-aging metadata
            (last change, min/max age…), unrelated to the hash itself
          </li>
        </ul>

        <p>
          <strong>Windows - SAM database (as dumped by tools like
          Mimikatz or Volatility):</strong>
        </p>
        <p className="code-block">
          <code>
            Administrator:500:AAD3B435B51404EEAAD3B435B51404EE:31D6CFE0D16AE931B73C59D7E0C089C0:::
          </code>
        </p>
        <ul>
          <li>
            <code>Administrator</code> - username, <code>500</code> - the
            account's RID
          </li>
          <li>
            <code>AAD3B435B51404EEAAD3B435B51404EE</code> - the LM hash
          </li>
          <li>
            <code>31D6CFE0D16AE931B73C59D7E0C089C0</code> - the NTLM hash
          </li>
          <li>
            notice there's no salt field at all - LM and NTLM are unsalted,
            which is exactly why they're vulnerable to rainbow tables (see
            the LM and NTLM pages)
          </li>
        </ul>
      </section>

      <section>
        <h2>Common attacks against hashes</h2>
        <ul>
          <li>
            <strong>Rainbow tables:</strong> with rainbow tables (lots of a
            hash values), we just need to look for a match. Ultra-fast, but
            you need a gigantic amount of disk space, and salting makes it
            useless.
          </li>
          <li>
            <strong>Dictionary attacks:</strong> we create hash values of
            commonly used words and look for the pre-hashed value.
          </li>
          <li>
            <strong>Brute-Force:</strong> brute-force is going through
            every possible permutation. Brute forcing a 7-digit [a-z]
            password with 100 billion attempts per second? 26<sup>7</sup>{' '}
            /100·10<sup>9</sup> = 0.08 seconds. 7 digits with [a-z ∪ A-Z]?
            52<sup>7</sup> /100·10<sup>9</sup> = 10.28 seconds. 10 digits
            with [a-z ∪ A-Z]? 16 days. 12 digits? 123 years…
          </li>
          <li>
            <strong>Collision:</strong> Collision is where another match is
            found, no matter the similarity of the original message. This
            can be defined as a Collision Attack. MD5 is particularly
            vulnerable.
          </li>
        </ul>
      </section>

      <section>
        <h2>Hashing algorithms</h2>
        <div className="algo-grid">
          {hashingAlgorithms.map((algo) => (
            <Link
              key={algo.slug}
              to={`/hashing/${algo.slug}`}
              className="algo-button"
            >
              {algo.shortName ?? algo.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Hashing
