import { useState } from 'react'
import {
  hexToText,
  opensslDecrypt,
  opensslEncrypt,
  randomHex,
  textToHex,
} from '../lib/opensslDemo'

const VARIANTS = {
  'RC4 (128-bit)': { cipher: 'rc4', keyBytes: 16 },
  'RC4-40 (export)': { cipher: 'rc4-40', keyBytes: 5 },
} as const

type VariantName = keyof typeof VARIANTS
type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function Rc4CipherLab() {
  const [variant, setVariant] = useState<VariantName>('RC4 (128-bit)')
  const [key, setKey] = useState(() =>
    randomHex(VARIANTS['RC4 (128-bit)'].keyBytes),
  )
  const [input, setInput] = useState('')
  const [ciphertext, setCiphertext] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [phase, setPhase] = useState<Phase>('encrypt')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleReset() {
    setPhase('encrypt')
    setInput('')
    setCiphertext('')
    setPlaintext('')
    setErrorMsg('')
  }

  function handleVariantChange(name: VariantName) {
    setVariant(name)
    setKey(randomHex(VARIANTS[name].keyBytes))
    handleReset()
  }

  async function handleEncrypt() {
    if (!input) return
    setStatus('loading')
    setErrorMsg('')
    const response = await opensslEncrypt({
      cipher: VARIANTS[variant].cipher,
      keyHex: key,
      dataHex: textToHex(input),
    })
    setStatus('idle')
    if (response.ok && response.dataHex) {
      setCiphertext(response.dataHex)
      setPhase('encrypted')
    } else {
      setErrorMsg(response.error ?? 'Something went wrong')
    }
  }

  async function handleDecrypt() {
    setStatus('loading')
    setErrorMsg('')
    const response = await opensslDecrypt({
      cipher: VARIANTS[variant].cipher,
      keyHex: key,
      dataHex: ciphertext,
    })
    setStatus('idle')
    if (response.ok && response.dataHex !== undefined) {
      setPlaintext(hexToText(response.dataHex))
      setPhase('decrypted')
    } else {
      setErrorMsg(response.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {(Object.keys(VARIANTS) as VariantName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleVariantChange(name)}
            className={
              name === variant
                ? 'cost-button cost-button-active'
                : 'cost-button'
            }
          >
            {name}
          </button>
        ))}
      </div>

      <div className="hash-input-row">
        <input
          type="text"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Key (hex)…"
          className="explorer-input"
          readOnly={phase !== 'encrypt'}
        />
        <button
          type="button"
          onClick={() => setKey(randomHex(VARIANTS[variant].keyBytes))}
          disabled={phase !== 'encrypt'}
          className="cost-button"
        >
          Randomise key
        </button>
      </div>

      {phase === 'encrypt' && (
        <>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type something to encrypt…"
            className="explorer-input"
          />
          <button
            type="button"
            onClick={handleEncrypt}
            disabled={status === 'loading' || !input}
            className="compute-button"
          >
            {status === 'loading' ? 'Encrypting…' : 'Encrypt'}
          </button>
        </>
      )}

      {phase !== 'encrypt' && (
        <p className="hash-result">
          Ciphertext <code>{ciphertext}</code>
        </p>
      )}

      {phase === 'encrypted' && (
        <button
          type="button"
          onClick={handleDecrypt}
          disabled={status === 'loading'}
          className="compute-button"
        >
          {status === 'loading' ? 'Decrypting…' : 'Decrypt'}
        </button>
      )}

      {phase === 'decrypted' && (
        <p className="hash-result">
          Plaintext <code>{plaintext}</code>
        </p>
      )}

      {errorMsg && <p className="hash-result">OpenSSL says: {errorMsg}</p>}

      {phase !== 'encrypt' && (
        <button type="button" onClick={handleReset} className="cost-button">
          Start over
        </button>
      )}

      <p className="demo-note">
        RC4-40 is the same story as RC2-40: a 5-byte key deliberately
        weakened for 1989 export approval, versus 16 bytes for full RC4.
      </p>
    </div>
  )
}

export default Rc4CipherLab
