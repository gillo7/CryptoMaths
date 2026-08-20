import { useState } from 'react'
import {
  hexToText,
  opensslDecrypt,
  opensslEncrypt,
  randomHex,
  textToHex,
} from '../lib/opensslDemo'

const VARIANTS = {
  'RC2 (128-bit)': { cipher: 'rc2-cbc', keyBytes: 16 },
  'RC2-64': { cipher: 'rc2-64-cbc', keyBytes: 8 },
  'RC2-40 (export)': { cipher: 'rc2-40-cbc', keyBytes: 5 },
} as const

type VariantName = keyof typeof VARIANTS
type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function Rc2CipherLab() {
  const [variant, setVariant] = useState<VariantName>('RC2 (128-bit)')
  const [key, setKey] = useState(() =>
    randomHex(VARIANTS['RC2 (128-bit)'].keyBytes),
  )
  const [iv, setIv] = useState(() => randomHex(8))
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
      ivHex: iv,
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
      ivHex: iv,
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

      <div className="hash-input-row">
        <input
          type="text"
          value={iv}
          onChange={(event) => setIv(event.target.value)}
          placeholder="IV (hex)…"
          className="explorer-input"
          readOnly={phase !== 'encrypt'}
        />
        <button
          type="button"
          onClick={() => setIv(randomHex(8))}
          disabled={phase !== 'encrypt'}
          className="cost-button"
        >
          Randomise IV
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
        RC2-40 is the deliberately weakened export cipher from the section
        above - notice its key is only 5 bytes, versus 16 for full RC2.
        That's the entire reason it was considered exportable in 1989: a
        small enough keyspace for intelligence agencies to brute-force,
        but not casual attackers of the time.
      </p>
    </div>
  )
}

export default Rc2CipherLab
