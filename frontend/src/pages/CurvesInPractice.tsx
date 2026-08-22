import { Link } from 'react-router-dom'
import KeyExchangePlaceholder from './KeyExchangePlaceholder'
import './KeyExchange.css'
import './SymmetricEncryption.css'

function CurvesInPractice() {
  return (
    <main className="key-exchange-page">
      <Link to="/key-exchange" className="back-link">
        ← Back to Key Exchange
      </Link>

      <h1>Curves in Practice</h1>

      <section>
        <p>Not every curve is trusted equally, and the history explains why.</p>
        <p>
          In 2013, the New York Times reported, based on documents leaked
          by Edward Snowden, that the NSA had deliberately weakened
          Dual_EC_DRBG, a random number generator NIST had standardised,
          embedding a backdoor that let anyone holding the NSA's secret
          key recover encryption keys from just 32 bytes of output. RSA
          Security formally advised its customers to stop using it within
          days. That confirmed backdoor cast a long shadow over NIST's
          other elliptic curve standards too, cryptographers including
          Bruce Schneier publicly said they no longer trusted the NIST
          curves' own unexplained constants, though, unlike Dual_EC_DRBG,
          no backdoor in P-256 or its siblings has ever actually been
          proven, suspicion, not confirmed compromise.
        </p>
        <KeyExchangePlaceholder label="Article link (NYT / Snowden Dual_EC_DRBG report)" />

        <p>
          That controversy is exactly why Curve25519 exists. Daniel
          Bernstein designed it with every constant chosen transparently
          and justified, nothing left unexplained, specifically to avoid
          the same suspicion. It's become the community-trusted default
          as a result.
        </p>

        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Curve</th>
                <th>Also known as</th>
                <th>Key size</th>
                <th>Used in</th>
                <th>Trust</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P-256</td>
                <td>secp256r1</td>
                <td>256-bit</td>
                <td>TLS, HTTPS, Apple, Google</td>
                <td>Widely deployed, unexplained constants</td>
              </tr>
              <tr>
                <td>P-384</td>
                <td>secp384r1</td>
                <td>384-bit</td>
                <td>NSA Suite B, government systems</td>
                <td>High security, same origin</td>
              </tr>
              <tr>
                <td>P-521</td>
                <td>secp521r1</td>
                <td>521-bit</td>
                <td>Very high security needs</td>
                <td>Extremely strong, rarely needed</td>
              </tr>
              <tr>
                <td>Curve25519</td>
                <td>X25519 (in DH)</td>
                <td>255-bit</td>
                <td>TLS 1.3, Signal, WhatsApp, SSH</td>
                <td>Transparent design, community favourite</td>
              </tr>
              <tr>
                <td>secp256k1</td>
                <td>—</td>
                <td>256-bit</td>
                <td>Bitcoin, Ethereum</td>
                <td>Not a NIST curve, cryptocurrency standard</td>
              </tr>
            </tbody>
          </table>
        </div>

        <KeyExchangePlaceholder label="Examples of all the different curves and their efficiency" />
      </section>
    </main>
  )
}

export default CurvesInPractice
