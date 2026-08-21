import type { ReactNode } from 'react'
import Md5Explorer from './Md5Explorer'
import Md5CollisionDemo from './Md5CollisionDemo'
import LmExplorer from './LmExplorer'
import LmCrackerDemo from './LmCrackerDemo'
import NtlmExplorer from './NtlmExplorer'
import Sha1Explorer from './Sha1Explorer'
import Sha2Explorer from './Sha2Explorer'
import BcryptExplorer from './BcryptExplorer'
import BenchmarkExplorer from './BenchmarkExplorer'
import Sha3Explorer from './Sha3Explorer'
import ScryptExplorer from './ScryptExplorer'
import ScryptBenchmarkExplorer from './ScryptBenchmarkExplorer'
import Argon2Explorer from './Argon2Explorer'

export interface HashingAlgorithm {
  slug: string
  name: string
  shortName?: string
  content: ReactNode
}

export const hashingAlgorithms: HashingAlgorithm[] = [
  {
    slug: 'md5',
    name: 'MD5',
    content: (
      <>
        <p>
          It was designed in 1991 by Ronald Rivest (the R in RSA), as a
          successor to the earlier, already weak MD4. It was published as an
          open standard (RFC 1321) and quickly became one of the most widely
          adopted hash functions in computing history.
        </p>
        <p>
          MD5 is a cryptographic hash function. It takes an input of any
          size and produces a fixed 128-bit (16 byte, 32 hex characters)
          output. Same inputs always produce the same output, but only the
          smallest bit change produces a completely new unpredictable
          output.
        </p>
        <p>
          Structurally, MD5 (like SHA-1 and SHA-2 after it) uses a
          Merkle–Damgård construction: input is broken into fixed-size
          blocks, and each block is processed together with the output of
          the previous block, chaining forward until a final digest
          emerges. This chaining is elegant and efficient, but it's also
          the shared structural feature SHA-3 was later designed to abandon
          entirely.
        </p>
        <Md5Explorer />
        <p>
          Nowadays, creating a MD5 collision is trivial - even the modest
          Raspberry Pi 4 B powering this very site can find one in a few
          seconds, as demonstrated below. This completely undermines MD5's
          use anywhere collision resistance matters: digital signatures,
          certificate validation and, obviously, passwords.
        </p>
        <p>
          This only works one way. The demo below builds both messages
          together from scratch, so they're engineered from the start to
          share a hash - that's a collision. It can't take a hash that
          already exists and find a second message to match it afterwards;
          that's called a preimage attack, and MD5 has no practical break
          for it. That gap is exactly why MD5 checksums still catch
          accidental corruption just fine, but should never be trusted
          anywhere someone could swap one document for another - signatures,
          certificates, license keys.
        </p>
        <Md5CollisionDemo />
        <p>
          It is however still used for verifying file integrity during
          downloads or transfers, just to check for accidental bit-flips
          and in legacy systems or for non-security hashing.
        </p>
      </>
    ),
  },
  {
    slug: 'lm',
    name: 'LM (LAN Manager Hash)',
    shortName: 'LM',
    content: (
      <>
        <p>
          Introduced in the 1980s by Microsoft for its LAN Manager, an
          early networking system that predated modern Windows Networking,
          it is not a cryptographic hash in the MD5/SHA sense at all. It is
          built on DES (Data Encryption Standard), used in an unusual, very
          weak way.
        </p>
        <p>
          The idea is that the password is first converted to uppercase,
          then padded/truncated to exactly 14 characters. These are then
          split into two separate 7-character halves. Each 7-byte half is
          used as a DES key to encrypt a fixed, known string:{' '}
          <code>KGS!@#$%</code>. The two resulting 8-byte outputs are then
          concatenated into the final 16-byte LM hash.
        </p>
        <LmExplorer />
        <p>
          Why is this catastrophically weak? Splitting into two independent
          7-character halves is the fatal flaw. Instead of an attacker
          needing to brute-force a 14-character password (astronomically
          hard), they only ever need to crack two separate 7-character
          halves independently; a dramatically smaller search space, and if
          one half is shorter (e.g. a 5-character password), the second
          half becomes an easily recognizable fixed pattern:{' '}
          <code>AAD3B435B51404EE</code>, leaking that the password is
          short.
        </p>
        <p>
          It's such a well-known signature that password-cracking tools
          (like Hashcat or John the Ripper) specifically check for it as a
          first-pass optimisation: spotting <code>AAD3B435B51404EE</code>{' '}
          lets the tool immediately deprioritise brute-forcing that half
          and focus everything on the (already weak) first 7 characters.
        </p>
        <p>
          And if that wasn't enough, the case-insensitivity throws away
          enormous entropy by dividing the key space, and finally, the
          absence of salting makes the LM hash vulnerable to rainbow
          tables. No wonder Microsoft deprecated it in 2008! It is now
          replaced by NTLM. Nowadays, it rarely shows up, except in old
          legacy enterprise environment and in old operational systems
          nobody dared to touch.
        </p>
        <p>
          It is noticeable that LM was weak and broken from the start,
          unlike MD5 which got only weaker due to exponential progress in
          hardware, and was secure for around 15 years before being
          broken.
        </p>
        <p>
          Try it yourself below. Type a password and only its LM hash gets
          sent to the server - never the password itself, exactly like a
          real attacker who's stolen a hash dump and nothing else. The
          server actually runs John the Ripper against it, restricted to
          short passwords (up to 5 letters/digits) to keep the crack fast
          on this site's modest hardware; real cracking rigs make short
          work of considerably longer LM passwords too, for exactly the
          reasons explained above.
        </p>
        <LmCrackerDemo />
      </>
    ),
  },
  {
    slug: 'ntlm',
    name: 'NTLM (NT LAN Manager)',
    shortName: 'NTLM',
    content: (
      <>
        <p>
          It was introduced by Microsoft in the early 1990s as a direct
          replacement for the flawed LM. It went through two real
          revisions: NTLMv1, then the more hardened NTLMv2 in 1998, and
          remained the default Windows authentication protocol until
          Kerberos took over in Windows 2000 and beyond. NTLM never fully
          disappeared though, it is still used as a fallback wherever
          Kerberos can't be used: non-domain machines, workgroups or when
          authenticating to a resource by IP address rather than hostname.
        </p>
        <p>
          NTLM directly fixes LM's most damning flaw: instead of splitting
          the password into two independent 7-character halves and running
          them through weak case-insensitive DES, NTLM hashes the password
          as a single, case-sensitive unit, using MD4 (then later MD5)
          rather than DES.
        </p>
        <p>
          NTLM authentication itself works as a challenge-response
          protocol, not just a stored hash: the server sends a random
          challenge, the client encrypts it using a key derived from the
          password hash, and the server checks the response; meaning the
          raw hash itself is never sent over the wire during authentication
          (an improvement over some older, weaker LM-era approaches).
        </p>
        <NtlmExplorer />
        <p>
          It is still considered weak today, despite having some of its
          flaws fixed. It still has no salting and the same password used
          by two different users will produce the same hash: rainbow
          tables remain effective. Also, because authentication only
          requires the hash, not the plaintext password, an attacker who
          finds the hash can authenticate as the user without ever
          cracking the actual password, an attack known as
          "pass-the-hash". Credentials can be dumped from LSASS memory
          using tools like Mimikatz (purpose-built for credential
          extraction) or via broader memory forensics frameworks like
          Volatility, which can parse a full memory dump for credentials
          alongside process lists, network state, and other forensic
          artefacts.
        </p>
      </>
    ),
  },
  {
    slug: 'sha-1',
    name: 'SHA-1',
    content: (
      <>
        <p>
          Designed by the NSA and published by NIST in 1995, SHA-1
          replaced the short-lived and already weak SHA-0 (released in
          1993 and quietly withdrawn within a year due to an undisclosed
          flaw). SHA-1 became the dominant hash function of the late 1990s
          through the 2000s, adopted everywhere: TLS/SSL certificates,
          Git's commit hashing, PGP, and countless software integrity
          checks.
        </p>
        <Sha1Explorer />
        <p>
          SHA-1 is of the same family as MD5 conceptually, but bigger and
          stronger. It takes any length input and produces a fixed 160-bit
          (20-byte, 40 hex character) output, versus MD5's 128-bit output.
          The larger output was meant to buy meaningfully more collision
          resistance, since collision difficulty scales with output size.
          However, theoretical weaknesses were published as early as 2005,
          it took a decade, but in 2017, Google published the "SHAttered"
          attack, the first publicly demonstrated SHA-1 collision using
          roughly 6,500 GPU-years of compute in parallel to produce two
          different PDFs with an identical SHA-1 hash, proving the
          weakness identified was real, not just theoretical. Nowadays,
          SHA-1 is still being used in legacy systems and in older TLS
          certificate chains but it is being replaced by its stronger
          follow-up, SHA-2.
        </p>
        <a
          href="https://elie.net/static/files/the-first-collision-for-full-sha-1/the-first-collision-for-full-sha-1-paper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="article-preview"
        >
          <span className="article-kicker">Research paper - PDF</span>
          <p className="article-title">The first collision for full SHA-1</p>
          <p className="article-byline">
            Marc Stevens, Elie Bursztein, Pierre Karpman, Ange Albertini,
            Yarik Markov - CWI Amsterdam / Google Research, 2017
          </p>
          <p className="article-excerpt">
            "We demonstrate that SHA-1 collision attacks have finally
            become practical by providing the first known instance of a
            collision."
          </p>
        </a>
      </>
    ),
  },
  {
    slug: 'sha-2',
    name: 'SHA-2 (SHA-256/SHA-512)',
    content: (
      <>
        <p>
          SHA-2 has been designed by the NSA and published by NIST in
          2001, released when SHA-1 was still trusted. SHA-2 is not a
          single algorithm but a family: SHA-224, SHA-256, SHA-384,
          SHA-512, all share the same underlying construction but differ
          in output size and internal word size. SHA-256 and SHA-512 are
          the two most common variants. SHA-256 is the default hashing
          algorithm used these days: Bitcoin, TLS, Git, etc.
        </p>
        <Sha2Explorer />
        <p>
          The reason SHA-2 is stronger than SHA-1 is not simply the larger
          numbers. It uses more internal rounds, different message
          schedule and additional operations that specifically address the
          mathematical properties SHA-1's cryptanalysis exploited. The
          larger output does matter for raw collision resistance, but the
          internal redesign is doing real work too, not just padding.
        </p>
        <p>
          No practical collision attack exists against SHA-256 or SHA-512
          today and it is the current default safe choice across the
          industry. And whilst a cryptographically relevant quantum
          computer (CRQC) may leverage Grover's algorithm to provide a
          quadratic speedup for brute-forcing hash functions, it would
          only effectively halve SHA-256 security margin, weakening it but
          not effectively breaking it, which is why post-quantum
          cryptography has focussed its effort on more vulnerable
          algorithms such as Elliptic Curves and RSA, which are far more
          threatened by a CRQC leveraging Shor's algorithm, which provides
          an exponential speedup against the underlying maths.
        </p>
      </>
    ),
  },
  {
    slug: 'bcrypt',
    name: 'Bcrypt',
    content: (
      <>
        <p>
          Designed by Niels Provos and David Mazières in 1999, based on the
          Blowfish cipher (also Bruce Schneier's work), specifically for
          password hashing rather than general-purpose hashing. It's been
          the de facto standard recommendation for password storage for
          over two decades.
        </p>
        <p>What a bcrypt hash actually looks like:</p>
        <p>
          <code>$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW</code>
        </p>
        <ul>
          <li>
            <code>$2b$</code> - algorithm identifier/version
          </li>
          <li>
            <code>12</code> - the cost factor (2<sup>12</sup> = 4,096
            rounds)
          </li>
          <li>The next 22 characters - the embedded salt</li>
          <li>The rest - the actual hash output</li>
        </ul>
        <p>
          Unlike MD5/SHA-1/NTLM's "just a string of hex," a bcrypt hash is
          self-describing: it carries its own salt and cost factor right
          in the output, so verification never needs external metadata.
        </p>
        <BcryptExplorer />
        <p>
          MD5, SHA-1, SHA-2, even NTLM, are all fast by design, that's a
          feature for file integrity or general hashing, but a liability
          for password storage, since fast hashing means fast
          brute-forcing. Bcrypt inverts the goal entirely: it's
          deliberately, intentionally slow, and, critically, that
          slowness is tunable and future-proof.
        </p>
        <p>
          Every bcrypt hash embeds a unique random salt automatically as
          part of its output. This alone kills rainbow tables and the
          "same password, same hash" problem that plagued LM and NTLM.
        </p>
        <p>
          See the difference for yourself: compare how long MD5, SHA-256,
          and Bcrypt actually take to compute.
        </p>
        <BenchmarkExplorer />
        <p>
          Bcrypt runs its internal Blowfish-based key-expansion algorithm
          through a configurable number of rounds (typically 10 to 12
          rounds these days, meaning 1,024 to 4,096 rounds). This is the
          genuinely clever part: as hardware gets faster, you don't need a
          new algorithm: you just increase the cost factor, and the
          hashing gets proportionally slower again, keeping pace with
          Moore's Law indefinitely. This is precisely the future-proofing
          MD5/SHA-1/NTLM never had.
        </p>
        <p>
          Bcrypt is indeed the first entry on this page that was designed
          correctly from day one specifically for passwords, not a
          general-purpose hash repurposed for the job, which is exactly
          the mistake MD5, SHA-1, and NTLM all made.
        </p>
        <p>
          However, bcrypt's memory usage is relatively low and fixed,
          which has led to newer alternatives (Argon2, scrypt) designed
          specifically to also resist GPU/ASIC-parallelized cracking by
          requiring large amounts of memory, not just CPU time.
        </p>
        <p>
          Also, there is one limitation worth knowing: bcrypt has a
          maximum input length of 72 bytes: a quirk of its Blowfish-based
          key schedule. Anything longer gets silently truncated in many
          implementations, meaning a 100-character password and its first
          72 characters can hash identically. This has caused real
          security issues in practice where developers assumed longer
          inputs were adding proportional strength.
        </p>
      </>
    ),
  },
  {
    slug: 'sha-3',
    name: 'SHA-3',
    content: (
      <>
        <p>
          SHA-3's story starts differently than all the previous hashing
          algorithms. It was not created because the predecessor broke:
          SHA-2 is still unbroken to this day. Instead, NIST ran a public
          competition, mirroring how AES (Symmetric encryption) was
          chosen.
        </p>
        <p>
          The idea was to have an alternative if in the future, a
          vulnerability was found in SHA-2. The winning algorithm, Keccak,
          became SHA-3 in 2015.
        </p>
        <p>
          MD5, SHA-1, and SHA-2 all share the same underlying
          Merkle–Damgård construction: process input block by block,
          feeding each block's output into the next. SHA-3 abandons that
          entirely for a sponge construction: data is "absorbed" into a
          large internal state, then "squeezed" out to produce the output.
          If a future attack ever targeted a weakness inherent to
          Merkle–Damgård itself (rather than any one specific algorithm),
          SHA-3 wouldn't automatically be vulnerable: it doesn't share
          that structural DNA.
        </p>
        <Sha3Explorer />
        <p>
          It is standardised, available, used in some newer protocols and
          libraries, but it hasn't displaced SHA-2, largely because
          there's been no urgency: nothing's broken. It exists as
          institutional insurance, not a replacement.
        </p>
      </>
    ),
  },
  {
    slug: 'scrypt',
    name: 'Scrypt',
    content: (
      <>
        <p>
          Designed in 2009 by Colin Percival, originally for his Tarsnap
          online backup service, it was not initially a general-purpose
          password hasher, but a tool for deriving strong encryption keys
          from passphrases. It quickly got adopted far more broadly.
        </p>
        <ScryptExplorer />
        <p>
          It uses a genuinely new axis of defence: bcrypt made cracking
          slow by adding rounds that consumed CPU time. Scrypt asks a
          different question: what happens if you also made cracking
          expensive in memory (RAM)? Specialised cracking hardware (GPUs,
          and especially custom ASICs/FPGAs) are extraordinarily good at
          raw parallel computation: running millions of hash attempts
          simultaneously is exactly what that hardware exists for. But
          that same hardware is comparatively bad at handling large
          amounts of fast random-access memory per parallel unit; memory
          is expensive to replicate at scale, in a way raw compute cores
          aren't. Scrypt deliberately forces each hash attempt to allocate
          and repeatedly access a large, tunable block of memory during
          computation, which means an attacker trying to run millions of
          parallel attempts on custom hardware needs millions of copies of
          that memory too. It dramatically raises the real-world cost of
          building cracking hardware, not just slowing down a single
          attempt.
        </p>
        <p>
          Scrypt has separate parameters for CPU/time cost and memory
          cost, letting it scale forward with hardware improvements on
          both fronts independently, where bcrypt can only increase CPU
          time cost.
        </p>
        <p>
          See the difference for yourself: compare how long SHA-256 and
          Scrypt take to compute at different cost parameters.
        </p>
        <ScryptBenchmarkExplorer />
      </>
    ),
  },
  {
    slug: 'argon2',
    name: 'Argon2',
    content: (
      <>
        <p>
          Designed by Alex Biryukov, Daniel Dinu, and Dmitry Khovratovich,
          Argon2 won the Password Hashing Competition (2013–2015), an
          open, public contest run in the same spirit as the AES and
          SHA-3 selections, specifically to establish a single,
          rigorously-vetted best-practice password hasher. Where scrypt
          emerged somewhat organically from one engineer's specific need,
          Argon2 was built deliberately, from the start, as the answer,
          with the benefit of years of scrutiny on bcrypt and scrypt's
          real-world weaknesses already known.
        </p>
        <Argon2Explorer />
        <p>
          The idea is to use the same memory-hardness principle as scrypt,
          but refined: Argon2 keeps scrypt's core insight (make cracking
          expensive in memory, not just time), but tunes it more precisely
          and fixes specific weaknesses the competition judges identified
          in scrypt's design - particularly around resistance to certain
          time-memory trade-off attacks, where a clever attacker could
          reduce memory use at the cost of extra compute, partially
          undermining scrypt's memory-hardness guarantee under some
          conditions.
        </p>
        <p>Argon2 comes in three variants, tuned for different threats:</p>
        <ul>
          <li>
            <strong>Argon2d</strong> maximises resistance to GPU-cracking
            attacks, but is theoretically vulnerable to side-attack
            channels, making it best suited to contexts with no
            side-channel risk, like cryptocurrency mining.
          </li>
          <li>
            <strong>Argon2i</strong> makes memory access data-independent
            specifically to eliminate that side-channel risk, at the cost
            of some raw GPU-cracking resistance.
          </li>
          <li>
            <strong>Argon2id</strong> is a hybrid, using data-independent
            access for part of the process and data-dependant for the
            rest, aiming to get the best of both. This is the one variant
            recommended by OWASP and most modern guidance today.
          </li>
        </ul>
        <p>
          Where bcrypt and scrypt each solved one real problem in their
          moment, Argon2 is what happens when you take the accumulated
          lessons from both, run them through open competition and
          cryptanalysis, and let the result become the actual current
          standard.
        </p>
      </>
    ),
  },
]
