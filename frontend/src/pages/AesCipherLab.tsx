import { useState } from 'react'
import {
  hexToText,
  opensslDecrypt,
  opensslEncrypt,
  randomHex,
  textToHex,
} from '../lib/opensslDemo'

const KEY_SIZES = {
  'AES-128': { cipher: 'aes-128-cbc', keyBytes: 16 },
  'AES-192': { cipher: 'aes-192-cbc', keyBytes: 24 },
  'AES-256': { cipher: 'aes-256-cbc', keyBytes: 32 },
} as const

type SizeName = keyof typeof KEY_SIZES
type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function AesCipherLab() {
  const [size, setSize] = useState<SizeName>('AES-128')
  const [key, setKey] = useState(() => randomHex(KEY_SIZES['AES-128'].keyBytes))
  const [iv, setIv] = useState(() => randomHex(16))
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

  function handleSizeChange(name: SizeName) {
    setSize(name)
    setKey(randomHex(KEY_SIZES[name].keyBytes))
    handleReset()
  }

  async function handleEncrypt() {
    if (!input) return
    setStatus('loading')
    setErrorMsg('')
    const response = await opensslEncrypt({
      cipher: KEY_SIZES[size].cipher,
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
      cipher: KEY_SIZES[size].cipher,
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
        {(Object.keys(KEY_SIZES) as SizeName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleSizeChange(name)}
            className={
              name === size ? 'cost-button cost-button-active' : 'cost-button'
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
          onClick={() => setKey(randomHex(KEY_SIZES[size].keyBytes))}
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
          onClick={() => setIv(randomHex(16))}
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
        Same cipher, same mode as the rest of this section (CBC) - only the
        key length and round count change between AES-128, AES-192, and
        AES-256.
      </p>
    </div>
  )
}

export default AesCipherLab
