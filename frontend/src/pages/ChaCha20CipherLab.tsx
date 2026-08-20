import { useState } from 'react'
import {
  hexToText,
  opensslDecrypt,
  opensslEncrypt,
  randomHex,
  textToHex,
} from '../lib/opensslDemo'

const CIPHER = 'chacha20'
const KEY_BYTES = 32
const IV_BYTES = 16

type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function ChaCha20CipherLab() {
  const [key, setKey] = useState(() => randomHex(KEY_BYTES))
  const [iv, setIv] = useState(() => randomHex(IV_BYTES))
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

  async function handleEncrypt() {
    if (!input) return
    setStatus('loading')
    setErrorMsg('')
    const response = await opensslEncrypt({
      cipher: CIPHER,
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
      cipher: CIPHER,
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
          onClick={() => setKey(randomHex(KEY_BYTES))}
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
          onClick={() => setIv(randomHex(IV_BYTES))}
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
        No integrity check here - this is plain ChaCha20, not
        ChaCha20-Poly1305. Tampering with the ciphertext before decrypting
        would still "succeed" and silently produce garbled plaintext,
        exactly the gap Poly1305 exists to close.
      </p>
    </div>
  )
}

export default ChaCha20CipherLab
