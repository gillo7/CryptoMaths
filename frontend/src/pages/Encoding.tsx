import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Encoding.css'

const ASCII_PRINTABLE = Array.from({ length: 126 - 32 + 1 }, (_, i) => {
  const code = i + 32
  return {
    char: code === 32 ? 'space' : String.fromCharCode(code),
    decimal: code,
    hex: code.toString(16).toUpperCase().padStart(2, '0'),
    binary: code.toString(2).padStart(8, '0'),
  }
})

const HEX_DIGITS = Array.from({ length: 16 }, (_, i) => ({
  hex: i.toString(16).toUpperCase(),
  decimal: i,
  binary: i.toString(2).padStart(4, '0'),
}))

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64_CHARS = Array.from(BASE64_ALPHABET, (char, index) => ({
  index,
  char,
  binary: index.toString(2).padStart(6, '0'),
}))

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function toOctal(bytes: number[]): string {
  return bytes.map((b) => b.toString(8).padStart(3, '0')).join(' ')
}

function toBase32(bytes: number[]): string {
  if (bytes.length === 0) return ''
  let bits = ''
  bytes.forEach((b) => (bits += b.toString(2).padStart(8, '0')))
  let output = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0')
    output += BASE32_ALPHABET[parseInt(chunk, 2)]
  }
  while (output.length % 8 !== 0) output += '='
  return output
}

function toBase58(bytes: number[]): string {
  if (bytes.length === 0) return ''
  let num = 0n
  for (const b of bytes) {
    num = num * 256n + BigInt(b)
  }
  let output = ''
  while (num > 0n) {
    const remainder = num % 58n
    output = BASE58_ALPHABET[Number(remainder)] + output
    num /= 58n
  }
  for (const b of bytes) {
    if (b !== 0) break
    output = '1' + output
  }
  return output || '1'
}

function AsciiExplorer() {
  const [text, setText] = useState('Cipher')
  const chars = Array.from(text)

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something…"
        className="explorer-input"
        maxLength={40}
      />
      {chars.length > 0 && (
        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Char</th>
                <th>Decimal</th>
                <th>Hex</th>
                <th>Binary</th>
              </tr>
            </thead>
            <tbody>
              {chars.map((char, i) => {
                const code = char.codePointAt(0) ?? 0
                return (
                  <tr key={i}>
                    <td>
                      <code>{char === ' ' ? 'space' : char}</code>
                    </td>
                    <td>{code}</td>
                    <td>
                      <code>{code.toString(16).toUpperCase().padStart(2, '0')}</code>
                    </td>
                    <td>
                      <code>{code.toString(2).padStart(8, '0')}</code>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HexExplorer() {
  const [bits, setBits] = useState('01000011')
  const padded = bits.padStart(8, '0')
  const high = padded.slice(0, 4)
  const low = padded.slice(4, 8)
  const hex = parseInt(padded, 2).toString(16).toUpperCase().padStart(2, '0')

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={bits}
        onChange={(event) =>
          setBits(event.target.value.replace(/[^01]/g, '').slice(0, 8))
        }
        placeholder="Type a byte, e.g. 01001000"
        className="explorer-input"
        maxLength={8}
      />
      <div className="hex-breakdown">
        <div className="nibble">
          <code>{high}</code>
          <span className="nibble-arrow">→</span>
          <code>{parseInt(high, 2).toString(16).toUpperCase()}</code>
        </div>
        <div className="nibble">
          <code>{low}</code>
          <span className="nibble-arrow">→</span>
          <code>{parseInt(low, 2).toString(16).toUpperCase()}</code>
        </div>
      </div>
      <p className="hex-result">
        Byte <code>{padded}</code> → Hex <code>0x{hex}</code>
      </p>
    </div>
  )
}

function Base64Explorer() {
  const [text, setText] = useState('Cipher')
  const bytes = Array.from(new TextEncoder().encode(text))
  const groups: number[][] = []
  for (let i = 0; i < bytes.length; i += 3) {
    groups.push(bytes.slice(i, i + 3))
  }
  const fullBase64 = bytes.length
    ? btoa(String.fromCharCode(...bytes))
    : ''

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something…"
        className="explorer-input"
        maxLength={30}
      />
      {groups.length > 0 && (
        <div className="base64-breakdown">
          {groups.map((group, i) => (
            <div className="base64-group" key={i}>
              <code>
                {group.map((b) => b.toString(2).padStart(8, '0')).join(' ')}
              </code>
              <span className="nibble-arrow">→</span>
              <code>{btoa(String.fromCharCode(...group))}</code>
            </div>
          ))}
        </div>
      )}
      <p className="hex-result">
        Base64 <code>{fullBase64 || '—'}</code>
      </p>
    </div>
  )
}

function MultiboxExplorer() {
  const [text, setText] = useState('Cipher')
  const bytes = Array.from(new TextEncoder().encode(text))

  const rows: [string, string][] = [
    ['Decimal', bytes.join(' ')],
    ['Binary', bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ')],
    [
      'Hex',
      bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '),
    ],
    ['Octal', toOctal(bytes)],
    ['Base64', bytes.length ? btoa(String.fromCharCode(...bytes)) : ''],
    ['Base32', toBase32(bytes)],
    ['Base58', toBase58(bytes)],
  ]

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something…"
        className="explorer-input"
        maxLength={30}
      />
      <div className="multibox">
        {rows.map(([label, value]) => (
          <div className="multibox-row" key={label}>
            <span className="multibox-label">{label}</span>
            <code className="multibox-value">{value || '—'}</code>
          </div>
        ))}
      </div>
    </div>
  )
}

function Encoding() {
  return (
    <main className="encoding-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <h1>Encoding</h1>

      <section>
        <h2>What is encoding?</h2>
        <p>
          Humans think in symbols. Numbers (0-9), letters (a-z, A-Z),
          punctuation, accents. It differs in languages and cultures.
          Computers, instead, have only two states: on/off. 1 or 0, that is
          what we call the bit.
        </p>
        <p>
          For convenience, bits get grouped into bytes, a group of 8 bits. It
          gives 256 possible combinations, 2<sup>8</sup>, which is enough to
          represent every number, letter, punctuation. This is why 8 became
          the standard grouping size.
        </p>
      </section>

      <section>
        <h2>ASCII Table</h2>
        <p>
          Now, if we need to translate human symbols into computer speech, to
          encode them, we need a translating table, this is where the ASCII
          was originally created.
        </p>

        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Char</th>
                <th>Decimal</th>
                <th>Hex</th>
                <th>Binary</th>
              </tr>
            </thead>
            <tbody>
              {ASCII_PRINTABLE.map((row) => (
                <tr key={row.decimal}>
                  <td>
                    <code>{row.char}</code>
                  </td>
                  <td>{row.decimal}</td>
                  <td>
                    <code>{row.hex}</code>
                  </td>
                  <td>
                    <code>{row.binary}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Once we have translated human symbols into bits, we can relabel
          them for convenience, and doing so, we're re-encoding and decoding
          them, there is no mathematic or secret involved.
        </p>

        <AsciiExplorer />
      </section>

      <section>
        <h2>Hexadecimal</h2>
        <p>
          Reading long lines of 1s and 0s is easy for a computer, but rather
          tedious for a programmer. Therefore, for convenience, they found a
          friendlier way to write "in bits" by grouping them. Each
          hexadecimal character represents 4 bits, and 2 hex represent one
          byte.
        </p>

        <div className="table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Hex</th>
                <th>Decimal</th>
                <th>Binary</th>
              </tr>
            </thead>
            <tbody>
              {HEX_DIGITS.map((row) => (
                <tr key={row.hex}>
                  <td>
                    <code>{row.hex}</code>
                  </td>
                  <td>{row.decimal}</td>
                  <td>
                    <code>{row.binary}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          How to recognise hex? The core giveaway is the character set. Hex
          only ever uses 0-9 and a-f (or A-F), if a string contains any
          letter outside a-f, it is definitely not hex.
        </p>

        <HexExplorer />
      </section>

      <section>
        <h2>Base64</h2>
        <p>
          Base64 solves a different problem. It is used to safely transfer
          binary data using printable, transportable characters. Lots of
          systems (email, JSON, URLs, older text protocols) were designed to
          carry text, not arbitrary binary. If you try to shove raw binary
          bytes through them, control characters, null bytes, or
          non-printable values can break things or get mangled/stripped.
          Base64 solves this by re-encoding any binary data into a
          restricted set of 64 characters (hence the name..) that are
          guaranteed safe everywhere: A-Z, a-z, 0-9, +, /. And whilst a text
          transcribed in Base64 may look alien to the uninitiated, there is
          no encryption here, only transcription!
        </p>

        <div className="table-scroll">
          <table className="ref-table base64-table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Binary</th>
                <th>Char</th>
                <th>Index</th>
                <th>Binary</th>
                <th>Char</th>
              </tr>
            </thead>
            <tbody>
              {BASE64_CHARS.slice(0, 32).map((row, i) => {
                const pair = BASE64_CHARS[i + 32]
                return (
                  <tr key={row.index}>
                    <td>{row.index}</td>
                    <td>
                      <code>{row.binary}</code>
                    </td>
                    <td>
                      <code>{row.char}</code>
                    </td>
                    <td>{pair.index}</td>
                    <td>
                      <code>{pair.binary}</code>
                    </td>
                    <td>
                      <code>{pair.char}</code>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p>
          How does it work? Binary data comes in a stream of bytes (8 bits
          each), Base64 re-groups the bytes stream into 6-bit chunks, since
          2<sup>6</sup> = 64, matching the 64-character alphabet.
        </p>
        <p>
          8 and 6 don't divide evenly, but 24 does (the smallest common
          multiple): 24 bits are exactly 3 bytes and 4 six-bit Base64
          chunks. So Base64 processes data 3 bytes at a time, converting
          each group of 3 bytes into 4 Base64 characters.
        </p>
        <p>
          And at the end of the stream, if only 1 or 2 bytes are available?
          This is where the padding sign "=" comes in. One leftover byte
          gives "==", two leftover bytes give "=".
        </p>

        <Base64Explorer />

        <p>
          How to recognise it? The character set is a big giveaway,
          alongside the repeated, predictable padding signs "=", "==". The
          character set also has the two special signs: + and /, and no
          other.
        </p>
      </section>

      <section>
        <h2>Other encoding schemes</h2>
        <p>
          We covered the main encoding schemes, but there are many more out
          there! Octal (used in legacy linux commands, such as{' '}
          <code>chmod 755</code>), Base58 (variant of Base64 used in
          bitcoin), Base32 (TOTP secret keys from Google), etc.
        </p>

        <MultiboxExplorer />
      </section>

      <section>
        <h2>Quiz!</h2>
        <a
          href="https://www.wikiclass.org/exercise/jdznxk974843433"
          target="_blank"
          rel="noopener noreferrer"
          className="quiz-link"
        >
          Take the Encoding quiz on Wikiclass →
        </a>
      </section>
    </main>
  )
}

export default Encoding
