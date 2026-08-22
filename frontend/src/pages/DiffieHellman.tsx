import { Link } from 'react-router-dom'
import DhToyCalculator from './DhToyCalculator'
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
            <code className="multibox-value">2879, 9929 (agreed publicly)</code>
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
              B = 2879⁶ mod 9929 = 4850
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Alice's public value</span>
            <code className="multibox-value">
              A = 2879⁹ mod 9929 = 3614
            </code>
          </div>
          <div className="multibox-row">
            <span className="multibox-label">Shared secret</span>
            <code className="multibox-value">
              Alice: 4850⁹ mod 9929 = 4868 - Bob: 3614⁶ mod 9929 = 4868
            </code>
          </div>
        </div>
        <DhToyCalculator />
      </section>
    </main>
  )
}

export default DiffieHellman
