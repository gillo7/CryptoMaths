import { Link } from 'react-router-dom'
import DhToyCalculator from './DhToyCalculator'
import DhPemOutput from './DhPemOutput'
import DhEcdhSpeed from './DhEcdhSpeed'
import './KeyExchange.css'

function DiffieHellman() {
  return (
    <main className="key-exchange-page">
      <Link to="/key-exchange" className="back-link">
        ← Back to Key Exchange
      </Link>

      <h1>Diffie-Hellman</h1>

      <section>
        <p>
          Diffie-Hellman works by having both parties independently
          compute the very same secret, without ever transmitting it. It
          rests on the discrete logarithm problem: given g, p, and gᵃ mod
          p, finding a back out is computationally infeasible, even
          though computing gᵃ mod p in the first place is easy.
        </p>

        <p>The method, step by step:</p>
        <p>
          Both parties first agree on two public values, g, the
          generator, typically 2, 3, or 5, and p, a large prime, typically
          over 1024 bits in real use.
        </p>
        <p>
          Bob picks a secret number, b. Alice picks her own secret
          number, a. Neither ever shares these.
        </p>
        <p>
          Bob computes B = gᵇ mod p. Alice computes A = gᵃ mod p. They
          exchange A and B openly, Eve can see both.
        </p>
        <p>
          In Python: <code>B = pow(g, b, p)</code> for Bob,{' '}
          <code>A = pow(g, a, p)</code> for Alice.
        </p>
        <p>
          Each side then combines the other's public value with their own
          secret. Alice computes her shared key as Bᵃ mod p. Bob computes
          his as Aᵇ mod p. Both arrive at the identical result, gᵃᵇ mod p,
          without either ever having sent a, b, or the shared secret
          itself.
        </p>
        <p>
          In Python: <code>KeyA = pow(B, a, p)</code> for Alice,{' '}
          <code>KeyB = pow(A, b, p)</code> for Bob.
        </p>

        <p>
          Worked example, using deliberately small numbers to stay
          checkable by hand, real Diffie-Hellman uses primes far larger:
        </p>
        <div className="multibox">
          <div className="multibox-row">
            <span className="multibox-label">g, p</span>
            <code className="multibox-value">2, 9929 (agreed publicly)</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Bob's secret</span>
            <code className="multibox-value">b = 6</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Alice's secret</span>
            <code className="multibox-value">a = 9</code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Bob's public value</span>
            <code className="multibox-value">
              B = 2⁶ mod 9929 = 64
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Alice's public value</span>
            <code className="multibox-value">
              A = 2⁹ mod 9929 = 512
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Shared secret</span>
            <code className="multibox-value">
              Alice: 64⁹ mod 9929 = 4482 - Bob: 512⁶ mod 9929 = 4482
            </code>
          </div>
        </div>
        <DhToyCalculator />

        <p>
          Real Diffie-Hellman keys are named for their prime's size in
          bits. RFC 7919 defines a small set of standard groups,
          ffdhe2048, ffdhe3072, and ffdhe4096, that real implementations
          reuse rather than generate fresh. Unlike ECDH, classic DH
          doesn't shrink the key for equivalent security, a 2048-bit DH
          key is roughly as strong as a 2048-bit RSA key, not
          dramatically smaller the way an elliptic curve key is. It's the
          curve version specifically that buys the size reduction, not
          Diffie-Hellman's core idea on its own.
        </p>
        <DhPemOutput />

        <p>
          Real Diffie-Hellman almost always reuses a standard, pre-shared
          group of public values rather than generating its own - doing
          that yourself means finding a large safe prime, genuinely slow,
          costly work. The next section, ECDH, achieves the same result a
          different way, one that sidesteps that cost entirely:
        </p>
        <DhEcdhSpeed />
      </section>
    </main>
  )
}

export default DiffieHellman
