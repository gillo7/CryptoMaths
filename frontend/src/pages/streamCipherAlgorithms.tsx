import type { ReactNode } from 'react'
import SymmetricPlaceholder from './SymmetricPlaceholder'
import Rc4KeyExample from './Rc4KeyExample'
import Rc4CipherLab from './Rc4CipherLab'

export interface StreamCipherAlgorithm {
  slug: string
  name: string
  content: ReactNode
}

export const streamCipherAlgorithms: StreamCipherAlgorithm[] = [
  {
    slug: 'rc4',
    name: 'RC4',
    content: (
      <>
        <Rc4KeyExample />
        <p>
          Designed by Ron Rivest in 1987, RC4 was kept as a trade secret
          at RSA Security until 1994, when someone anonymously leaked its
          source to a mailing list. Because "RC4" is trademarked, the
          leaked version is often called ARCFOUR, "alleged RC4."
        </p>
        <p>
          RC4 is a simple, fast stream cipher. It maintains a 256 byte
          internal state, scrambled by the key, then continuously reads
          and swaps bytes from that state to produce a stream of
          pseudorandom output, XORed with the plaintext to encrypt or
          decrypt. No blocks, no padding, no rounds, just a flowing byte
          stream. That simplicity spread it everywhere: WEP, early WPA,
          SSL and TLS, RDP, Kerberos, even Microsoft Office.
        </p>
        <p>
          It was also RC4's downfall. The first few output bytes are
          statistically biased in ways that leak information about the
          key, first observed in 1995 and proven mathematically over the
          following decade. In 2001, Fluhrer, Mantin and Shamir turned
          this into a practical attack against WEP, and later refinements
          made cracking a WEP key a matter of minutes, a major factor in
          WEP's collapse as a wireless standard. RC4 lasted longer in
          TLS, ironically because being a stream cipher made it immune to
          the block cipher focused BEAST attack, but by 2013 researchers
          had found statistical attacks against RC4 in TLS too, serious
          enough to raise concern that intelligence agencies were already
          exploiting it. The IETF formally banned RC4 in TLS in 2015.
        </p>
        <p>
          RC4's legacy today is mostly visible in what replaced it.
          Several operating systems used RC4 internally to generate
          random numbers; by the mid 2010s, most had switched to
          Salsa20's successor, ChaCha20, covered in the next two
          sections.
        </p>
        <Rc4CipherLab />
      </>
    ),
  },
  {
    slug: 'salsa20',
    name: 'Salsa20',
    content: (
      <>
        <SymmetricPlaceholder label="Salsa20 example" />
        <p>
          Designed by Daniel J. Bernstein in 2005 and submitted to the
          eSTREAM European cryptographic validation process, Salsa20 was
          built as a modern, carefully engineered stream cipher, a
          deliberate contrast to RC4's simplicity born of trade secrecy
          rather than design rigour. It is not patented, and Bernstein
          published multiple public domain implementations optimised for
          common hardware.
        </p>
        <p>
          Structurally, Salsa20 is built entirely from three simple
          operations, addition, XOR, and bit rotation, known as ARX. It
          keeps a 512 bit internal state arranged as a 4 by 4 matrix of
          32 bit words, mixing key, a nonce, and a stream position
          counter together with four fixed constant words spelling
          "expand 32-byte k" in ASCII, a deliberate, transparent choice of
          constants meant to prove nothing suspicious is hidden inside
          them, the same nothing up my sleeve principle used elsewhere in
          cryptography. Salsa20 runs 20 rounds of mixing, alternating
          between operating on the matrix's columns and its rows, and
          because the key stream depends only on the counter position
          rather than what came before it, a user can jump to any point
          in the stream instantly, without needing to process everything
          that came earlier.
        </p>
        <p>
          Cryptanalysis of Salsa20 has been extensive and, so far,
          reassuring. No published attack breaks the full 20 round
          version; the best known attacks reach 8 of the 20 rounds, well
          short of anything practical. In 2013, researchers proved that
          just 15 rounds already provide full 128 bit security against
          differential cryptanalysis, meaning the full cipher carries a
          genuinely comfortable safety margin beyond what is actually
          needed.
        </p>
        <p>
          In 2008, Bernstein revisited his own design and published
          ChaCha, a modification aimed at improving diffusion, how
          quickly a single changed input bit spreads its influence across
          the whole output, while keeping performance the same or better.
        </p>
        <SymmetricPlaceholder label="Salsa20 interactive example" />
      </>
    ),
  },
  {
    slug: 'chacha20',
    name: 'ChaCha20',
    content: (
      <>
        <SymmetricPlaceholder label="ChaCha20 example" />
        <p>
          Bernstein's 2008 revision of Salsa20 keeps the same operations,
          round count, and state size, but mixes across diagonals instead
          of alternating rows and columns, and updates each word twice
          per round instead of once. The payoff is faster diffusion, a
          single changed input bit now flips 12.5 output bits on average
          instead of Salsa20's 8, without spending extra rounds to get
          it.
        </p>
        <p>
          ChaCha20 inherited Salsa20's track record of heavy scrutiny
          without a practical break, and picked up wide deployment as a
          result. It seeds random number generation across FreeBSD,
          OpenBSD, NetBSD, and, since 2016, the Linux kernel, explicitly
          replacing the broken RC4 that gave arc4random its now
          misleading name. Go and Rust use it too. Because it runs fast
          in pure software, it became the natural fit for systems without
          AES hardware acceleration, mobile devices, ARM chips, anything
          lacking AES-NI, where it usually outperforms AES outright.
        </p>
        <SymmetricPlaceholder label="Speed test on our ARM set without AES-NI to prove the point" />
        <p>
          On its own, ChaCha20 only provides confidentiality, the same
          integrity gap every stream or CBC-style cipher in this chapter
          has had. Poly1305, also by Bernstein, is a fast authentication
          code built to close it. Together, ChaCha20-Poly1305 encrypts
          with ChaCha20 and authenticates with Poly1305 in one combined
          operation, functionally the same idea as AES-GCM, built from
          entirely different primitives.
        </p>
        <p>
          Standardised by the IETF in 2015, it is the mode used
          throughout TLS 1.3 and the exclusive cipher behind WireGuard.
          Without hardware acceleration it usually beats AES-GCM, which
          is why it has become the standard alternative wherever AES-NI
          is not available, the direct answer to the AES-NI story running
          through this whole chapter.
        </p>
        <SymmetricPlaceholder label="ChaCha20 interactive examples" />
      </>
    ),
  },
]
