import type { ReactNode } from 'react'
import DesKeyExample from './DesKeyExample'
import DesCipherLab from './DesCipherLab'
import Rc2KeyExample from './Rc2KeyExample'
import Rc2CipherLab from './Rc2CipherLab'
import BlowfishKeyExample from './BlowfishKeyExample'
import BlowfishCipherLab from './BlowfishCipherLab'
import TwofishKeyExample from './TwofishKeyExample'
import TwofishCipherLab from './TwofishCipherLab'
import AesKeyExample from './AesKeyExample'
import BlockCipherBenchmark from './BlockCipherBenchmark'
import AesCipherLab from './AesCipherLab'

export interface BlockCipherAlgorithm {
  slug: string
  name: string
  content: ReactNode
}

export const blockCipherAlgorithms: BlockCipherAlgorithm[] = [
  {
    slug: 'des',
    name: 'DES',
    content: (
      <>
        <DesKeyExample />
        <p>
          Developed by IBM in the early 1970s, building on Horst Feistel's
          earlier Lucifer cipher, and published as a US federal standard
          in 1977 following NSA review, DES became the first publicly
          available, government-endorsed encryption standard and the
          benchmark every symmetric cipher since has been measured
          against. It's a Feistel cipher: each 64-bit block is split into
          two halves, processed across 16 rounds of substitution and
          permutation, with the halves swapped each round, a structure
          that makes encryption and decryption nearly identical processes.
          IBM's original design used a 128-bit key; the NSA pressured them
          down to just 56 bits, small enough that the NSA itself could
          brute-force it, while remaining out of reach for anyone else at
          the time. That compromise, not the algorithm's internal design,
          is what ultimately killed DES: in 1998, the Electronic Frontier
          Foundation built a dedicated cracking machine ("Deep Crack")
          that brute-forced a DES key in under three days, proving 56
          bits was no longer enough for anyone. DES was formally
          superseded by AES in 2001, though its interim patch, Triple DES
          (3DES), encrypting three times with up to three different keys,
          remained in limited use for years afterward before it, too, was
          deprecated.
        </p>
        <DesCipherLab />
      </>
    ),
  },
  {
    slug: 'rc2',
    name: 'RC2',
    content: (
      <>
        <Rc2KeyExample />
        <p>
          Designed by Ron Rivest (the R in RSA! And later the father of
          MD5.) in 1987 (RC standing for "Ron's Code"), RC2 was
          commissioned by Lotus Software, who needed a cipher for their
          Lotus Notes software - an email and collaboration tool - that
          would pass NSA export review. This gives RC2 a different origin
          story from DES: it wasn't a government standard, it was a
          commercial cipher built specifically to satisfy US cryptography
          export restrictions, which at the time heavily limited how
          strong encryption American companies were allowed to sell
          abroad. The NSA suggested changes, Rivest incorporated them, and
          the cipher was approved for export in 1989, alongside RC4, both
          of which were treated favourably at a weakened 40-bit key size
          specifically because that size was considered breakable by
          intelligence agencies but impractical for casual attackers at
          the time, the same underlying logic that shaped DES's key
          length.
        </p>
        <p>
          RC2 is a 64-bit block cipher with a variable key size (from 1 to
          128 bytes), built as an unbalanced Feistel network: 16 rounds of
          one operation (MIXING) punctuated by 2 rounds of a different
          operation (MASHING). Unlike DES's classified S-box design, RC2's
          internal details stayed proprietary and secret to RSA Security
          rather than government-controlled, until January 1996, when
          someone anonymously leaked the source code to a Usenet forum,
          evidence pointing to reverse engineering rather than an
          authorised release. Rivest published the algorithm officially
          himself two years later.
        </p>
        <p>
          RC2 is vulnerable to a related-key attack, and combined with its
          deliberately weakened 40-bit export variant, it has long been
          considered obsolete for any real security use today. Its main
          relevance now is historical: RC2 is a clear example of how
          1990s export law, not just cryptanalysis, directly shaped which
          encryption strengths got built and deployed at the time, a
          policy legacy that still echoes in how older systems and file
          formats (some legacy PDF and Microsoft Office encryption, for
          instance) were built around it.
        </p>
        <Rc2CipherLab />
      </>
    ),
  },
  {
    slug: 'blowfish',
    name: 'Blowfish',
    content: (
      <>
        <BlowfishKeyExample />
        <p>
          Designed by Bruce Schneier in 1993, Blowfish was built as a
          free, unpatented alternative to DES at a time when most
          competing designs were either government-controlled,
          commercially licensed, or tied up in patents. Schneier placed it
          explicitly in the public domain, freely usable by anyone, which
          is a large part of why it spread so widely into cryptographic
          software over the following decade.
        </p>
        <p>
          Blowfish is a 64-bit block cipher with a variable key length
          from 32 up to 448 bits, structured as a 16-round Feistel cipher,
          the same general family as DES. What makes it distinctive is
          its key schedule: before any actual encryption happens,
          Blowfish uses the key to generate its own internal S-boxes and
          subkeys, seeded from the digits of pi and then repeatedly
          scrambled by running the cipher itself hundreds of times, a
          process that takes the equivalent of encrypting about 4
          kilobytes of data before a single real message is processed.
          That setup is unusually slow compared to other ciphers of its
          era, and normally slowness would be a weakness. This is exactly
          the property bcrypt was later built around, deliberately
          exploiting that expensive key setup to make password cracking
          slower too.
        </p>
        <p>
          Blowfish's real limitation is its 64-bit block size, small by
          modern standards (AES uses 128-bit blocks). A small block size
          becomes a statistical liability once enough data has been
          encrypted under the same key: past roughly 32 gigabytes, a
          repeated block becomes a near-certainty, and in 2016 the
          SWEET32 attack demonstrated exactly how to exploit that
          repetition to recover plaintext from ciphers with 64-bit
          blocks, affecting both Blowfish and 3DES in real protocols like
          HTTPS and OpenVPN. As a result, Blowfish is now considered fine
          for smaller amounts of data, GnuPG recommends staying under 4GB
          per file, but unsuitable for bulk encryption at scale. Schneier
          himself has since recommended migrating to its intended
          successor, Twofish, which fixes the block size limitation
          directly.
        </p>
        <BlowfishCipherLab />
      </>
    ),
  },
  {
    slug: 'twofish',
    name: 'Twofish',
    content: (
      <>
        <TwofishKeyExample />
        <p>
          Designed in 1998 by Bruce Schneier and a team including John
          Kelsey, Doug Whiting, David Wagner, Chris Hall, and Niels
          Ferguson, Twofish was Schneier's own entry to the AES
          competition, built explicitly as Blowfish's successor with a
          128-bit block size instead of the vulnerable 64-bit one flagged
          in Blowfish's section. It made it to the final round of five
          AES finalists but lost to Rijndael.
        </p>
        <p>
          Structurally, Twofish keeps Blowfish's Feistel design and
          key-dependent S-boxes, adding a more complex key schedule and a
          technique called the pseudo-Hadamard transform to spread
          changes more thoroughly through its internal state. Like
          Blowfish, it was released free of patents, so cost was never
          the reason it lost.
        </p>
        <p>
          The real reason is hardware, not cryptography. Twofish was
          roughly comparable in speed to Rijndael at launch, but since
          2008 virtually every AMD and Intel processor has included
          dedicated hardware acceleration built specifically for
          Rijndael's operations. No software implementation can compete
          with that. Twofish remains unbroken in any practical sense, its
          elimination from AES came down to industry momentum, not a
          weakness in the maths. It still sees limited use today, notably
          in the OpenPGP standard, but never matched Blowfish's spread.
        </p>
        <TwofishCipherLab />
      </>
    ),
  },
  {
    slug: 'aes',
    name: 'AES',
    content: (
      <>
        <AesKeyExample />
        <p>
          Selected by NIST in 2001 after a five year, fifteen candidate
          public competition, the same process that Twofish lost. The
          winning design was Rijndael, built by two Belgian
          cryptographers, Joan Daemen and Vincent Rijmen. AES became the
          official US federal standard in 2002, and it is the only
          publicly available cipher the NSA has approved for encrypting
          top secret information, when used correctly.
        </p>
        <p>
          Unlike DES, Blowfish, and Twofish, AES does not use a Feistel
          structure. It is built on a substitution permutation network
          instead, with a fixed 128-bit block size and a key size of 128,
          192, or 256 bits. The key size determines how many rounds the
          cipher runs: 10 rounds for AES-128, 12 for AES-192, 14 for
          AES-256. Each round applies four steps, SubBytes (a non-linear
          byte substitution), ShiftRows (a row shuffle), MixColumns (a
          mixing operation across each column), and AddRoundKey
          (combining the state with that round's derived subkey). The
          final round skips MixColumns.
        </p>
        <p>
          AES was designed for speed and efficiency across a huge range
          of hardware, from 8-bit smart cards up to server processors,
          and that design goal paid off in a way that shaped the outcome
          of the whole cipher landscape. Since 2008, AMD and Intel have
          built dedicated hardware instructions directly into their
          processors specifically to accelerate AES, the AES-NI
          instruction set. This is the same hardware advantage discussed
          in Twofish's section, the reason AES pulled decisively ahead of
          every software-only competitor once modern CPUs arrived.
        </p>

        <div className="info-box">
          <h3>AES-NI (AES New Instructions)</h3>
          <p>
            AES-NI is a set of extra instructions Intel added directly
            into its processors starting in 2008, later adopted by AMD
            too, purpose built to run AES faster. Normally, a processor
            performs AES by running many separate, general purpose
            instructions, one for each step of SubBytes, ShiftRows,
            MixColumns, and AddRoundKey, across every round. AES-NI
            collapses several of those steps into single dedicated
            hardware instructions, letting the chip perform a full
            encryption round in one pass instead of many.
          </p>
          <p>
            The performance difference is not marginal. On a processor
            with AES-NI, encryption typically runs 3 to 10 times faster
            than a pure software implementation of the same algorithm,
            and it closes a security gap too, since dedicated hardware
            execution avoids the variable timing and memory access
            patterns that made earlier software AES implementations
            vulnerable to cache timing side channel attacks.
          </p>
          <p>
            Not every processor has it. ARM chips historically shipped
            their own separate cryptography extensions, and, as this
            app's own benchmarking server demonstrates, not every ARM
            chip includes them either. On hardware without any form of
            acceleration, a cipher like ChaCha20, purpose built to run
            fast in ordinary software, closes most or all of the gap
            AES-NI would otherwise open, which is exactly why it exists
            as AES's real world alternative rather than a purely
            academic curiosity.
          </p>
          <BlockCipherBenchmark />
        </div>

        <p>
          Cryptanalytically, AES remains unbroken in any practical sense.
          The best published key recovery attacks are only marginally
          faster than brute force, shaving a handful of bits off the
          theoretical keyspace, and even then they require storing more
          data than exists on every computer on the planet combined. The
          real-world attacks that have succeeded target implementations
          rather than the algorithm itself, timing and cache side channel
          attacks that leak information through how long an operation
          takes or which memory gets accessed, not through any weakness
          in the maths. Modern hardware AES instructions largely close
          off these side channels too.
        </p>
        <p>
          AES-256 is considered quantum resistant. A quantum computer
          running Grover's algorithm would only halve its effective
          security margin, the same story already covered for SHA-2,
          leaving AES-256 still solidly secure. AES-128 and AES-192 are
          not considered safe against a future quantum attacker, which is
          why AES-256 specifically, not the smaller key sizes, is the
          recommended standard going forward.
        </p>
        <AesCipherLab />
      </>
    ),
  },
]
