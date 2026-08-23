import { Link } from 'react-router-dom'
import CertificateExample from './CertificateExample'
import CertificatesPlaceholder from './CertificatesPlaceholder'
import './Certificates.css'
import './SymmetricEncryption.css'

function Certificates() {
  return (
    <main className="certificates-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Certificates</h1>

      <section>
        <p>
          In the{' '}
          <Link to="/public-key-encryption">Public Key Encryption</Link>{' '}
          chapter, I described how, to authenticate a message, Alice could
          sign the message, using her private key, so that Bob, using her
          public key, could verify the message. Hence, he would be sure
          that the message is Alice's and nobody else's.
        </p>
        <p>
          However, Eve is determined to achieve mischief, and plots an
          evil plan (again!). She can simply stay in the middle of the
          conversation, and pretend to be both Bob and Alice. By
          providing them with a fake public key, they will consider her
          to be a safe, verified friend, and will send messages that she
          will be able to decrypt, and send along to the other person
          with a fake signature that will be verified against the fake
          public key. This is called a man-in-the-middle (MITM) attack.
          She intercepts messages, decrypts them, re-encrypts them with
          the fake key, sends them along, and Bob and Alice will never
          know that the entire communication is being eavesdropped on.
        </p>
        <p>
          So here comes Trent. Trent is a third-party, he sits outside
          the conversation. He has only one job, to prevent Eve from
          performing her habitual mischievousness. What he does is
          simple. When Alice is ready to send her message, she asks
          Trent for a certificate. A certificate is a file containing
          Alice's public key, her identity, and Trent's own signature,
          vouching that the two genuinely belong together, all of it
          signed with Trent's private key. Now that a certificate is
          attached to the message, Alice can send it to Bob. When Bob
          receives it, he first reads the certificate. Since he has
          Trent's public-key, Trent is a very famous guy, everyone trusts
          him and has his public-key, he can verify the certificate,
          which guarantees the authenticity of the sender. If Eve was to
          intercept anything, she could mess with the signature, yes, but
          not with the certificate itself, therefore making it impossible
          for her to intercept and impersonate messages as before.
        </p>
        <p>
          And what happens if Bob has never heard of Trent? Well, there
          is a chain-of-trust on the internet, composed of Certificate
          Authorities (CA), and Root Certificates. If Trent is not in
          Bob's list, he can go up his local CA all the way to the Root
          Certificates to verify if Trent is legit through a simple fact:
          if Trent is trusted by the same Root Certificates that Bob
          trusts, then Trent is trusted.
        </p>
      </section>

      <section>
        <h2>X.509 Certificates</h2>
        <p>
          A digital certificate solves a specific problem: it lets Bob
          share his public key with Alice in a way she can actually
          trust. Structurally, it's a file bundling a few things
          together, the subject's identity, their public key, the
          issuer's identity, the certificate's validity period, and a
          signature over the whole bundle, all defined by a standard
          called X.509.
        </p>
        <p>
          Crucially, a certificate you'd receive from someone else only
          ever contains their public key, never their private one. Some
          certificate formats, like PFX/P12, can bundle a private key
          too, but those exist purely for someone's own local backup or
          import use, never for sharing, that private key is meant to
          leave the machine it was generated on exactly zero times.
        </p>
        <p>
          Real certificates come in a few common formats. PEM and PKCS7
          are text, Base64-encoded, the same encoding covered in this
          app's own <Link to="/encoding">Encoding</Link> chapter. DER and
          CER are the equivalent data in raw binary form.
        </p>
        <CertificateExample />
        <figure className="figure">
          <img
            src="/images/wikiclass.png"
            alt="A certificate viewer showing wikiclass.org's real certificate:
              Issued To wikiclass.org, Issued By R12 / Let's Encrypt, a
              Validity Period, and SHA-256 fingerprints for both the
              certificate and its public key"
          />
          <figcaption>wikiclass.org's actual certificate, viewed in a browser</figcaption>
        </figure>
        <CertificatesPlaceholder label="Paste in a real certificate, or generate one above, and see it decoded field by field, subject, issuer, validity dates, public key, signature algorithm, exactly what your browser checks every time you visit an HTTPS site" />
      </section>

      <section>
        <h2>Certificate Authority</h2>
        <p>
          A certificate authority is exactly what Trent represents in
          this chapter's opening story, a trusted third party whose
          entire job is to verify identity and sign certificates that
          vouch for it. In practice, this trust runs in tiers, not
          everyone signs directly for everyone else.
        </p>
        <p>
          At the top sit Root CAs, always trusted, their public keys
          pre-installed by default in every operating system and
          browser, and deliberately long-lived, often valid for decades.
          Below them, Intermediate CAs handle the day-to-day signing,
          trusted because a Root CA vouches for them, not because they're
          trusted directly.
        </p>
        <CertificatesPlaceholder label="Screenshots of actual root certificates on real machines, Ubuntu, MacOS, Windows" />
        <p>
          Self-signed certificates, where an entity signs its own
          certificate, can never be genuinely trusted by anyone else,
          they're used purely for local development, exactly the kind
          you'd generate testing an app before it ever goes live.
        </p>
        <p>
          Getting a certificate signed involves a real, defined process.
          An organisation generates a key pair and bundles the public key
          into a Certificate Signing Request, a CSR. A CA verifies who's
          actually asking, then signs that CSR into a finished
          certificate, a CRT, using the CA's own private key. The most
          widely used CA today is Let's Encrypt, a nonprofit, entirely
          free, launched in 2014 by the EFF, Mozilla, Cisco, and Akamai
          together, specifically to make HTTPS free and universal rather
          than something only companies who could pay a commercial CA had
          access to. Every certificate on cryptomaths.org and
          wikiclass.org runs on Let's Encrypt.
        </p>
        <CertificatesPlaceholder label="Screenshot: Let's Encrypt certificate details for cryptomaths.org or wikiclass.org" />
        <p>
          This whole system only works if CAs are actually trustworthy,
          and history shows that trust has genuinely broken, more than
          once. In 2001, VeriSign issued two certificates to someone
          falsely claiming to represent Microsoft, both stamped
          "Microsoft Corporation," usable to make malicious software
          updates look like they came from Microsoft itself. In 2011,
          attackers, reportedly Iranian, compromised the CA DigiNotar and
          issued fraudulent certificates later confirmed to have been
          used in real man-in-the-middle attacks against Iranian internet
          users. And in 2015, a Chinese CA called MCS Holdings issued
          unauthorised certificates for Google's own domains, Google
          responded by removing MCS's entire root of trust from Chrome
          outright.
        </p>
        <CertificatesPlaceholder label="Article links: VeriSign 2001, DigiNotar 2011, MCS Holdings 2015" />
        <p>
          That's the sharp edge of what "trust" actually means in this
          system: if a single Root CA is ever compromised or misbehaves,
          everyone who trusted it, which, given how few root CAs exist,
          means enormous swaths of the internet, is exposed until
          browsers and operating systems actively revoke that trust.
        </p>
      </section>
    </main>
  )
}

export default Certificates
