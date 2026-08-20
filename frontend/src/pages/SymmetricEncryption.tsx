import { Link } from 'react-router-dom'
import BlockCipherBenchmark from './BlockCipherBenchmark'
import BrowserCipherBenchmark from './BrowserCipherBenchmark'
import './SymmetricEncryption.css'

function SymmetricEncryption() {
  return (
    <main className="symmetric-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Symmetric encryption</h1>

      <section>
        <p>
          Symmetric encryption is, at its highest level, the process of
          generating a key, to be shared between the two persons exchanging
          messages, and using a range of algorithms to use the key to
          encrypt/decrypt messages.
        </p>
        <p>
          Whilst hashing makes the data unrecoverable, symmetric encryption
          has been perfected to encrypt and decrypt large amounts of data
          very efficiently, using a range of algorithms and techniques
          described below.
        </p>
        <p>
          Symmetric encryption is dramatically faster and more efficient
          for bulk data than asymmetric. Entire gigabytes of data can be
          safely encrypted in seconds. This is why it is widely used
          alongside asymmetric encryption, which in turn is perfect to
          safely transfer the symmetric shared key. This is what happens
          whenever you connect to the internet or start a WhatsApp
          conversation, for example.
        </p>
        <p>
          Block ciphers divide the data to be encrypted in blocks of fixed
          sizes, using padding when needed, and mangle each block
          separately, before reassembling it in the cipher. When
          decrypting, each block is separated again and decrypted before
          the initial message is reassembled.
        </p>
      </section>

      <section>
        <div className="section-grid">
          <Link to="/symmetric-encryption/block-ciphers" className="section-button">
            Block Ciphers
          </Link>
          <Link to="/symmetric-encryption/stream-ciphers" className="section-button">
            Stream Ciphers
          </Link>
        </div>
      </section>

      <section>
        <p>
          Here is a comparison, created live on our server's hardware, of
          the efficiency of every reviewed algorithm, ranked by speed:
        </p>
        <BlockCipherBenchmark
          endpoint="/api/openssl/benchmark-all"
          excludedNote={
            <>
              Twofish and Salsa20 aren't included: OpenSSL has never
              implemented either, so their demos run as client-side JS
              instead - not a measurement of this server's hardware, so not
              a fair comparison against everything else in this list.
            </>
          }
        />
        <p>
          Note that we are using non-AES-NI hardware. If you would like to
          test your own hardware instead, no installation needed, just run
          it right here in your browser:
        </p>
        <BrowserCipherBenchmark />
      </section>

      <section>
        <h2>Quiz!</h2>
        <a
          href="https://www.wikiclass.org/exercise/skr950fhgo8jeuj"
          target="_blank"
          rel="noopener noreferrer"
          className="quiz-link"
        >
          Take the Symmetric Encryption quiz on Wikiclass →
        </a>
      </section>
    </main>
  )
}

export default SymmetricEncryption
