import { useState } from 'react'
import { bytesToHex, hexToBytes, randomHex } from '../lib/hexUtils'
import { salsa20Xor } from '../lib/salsa20Demo'

const KEY_BYTES = 32
const NONCE_BYTES = 8

type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function Salsa20CipherLab() {
  const [key, setKey] = useState(() => randomHex(KEY_BYTES))
  const [nonce, setNonce] = useState(() => randomHex(NONCE_BYTES))
  const [input, setInput] = useState('')
  const [ciphertext, setCiphertext] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [phase, setPhase] = useState<Phase>('encrypt')
  const [errorMsg, setErrorMsg] = useState('')

  function handleReset() {
    setPhase('encrypt')
    setInput('')
    setCiphertext('')
    setPlaintext('')
    setErrorMsg('')
  }

  function handleEncrypt() {
    if (!input) return
    setErrorMsg('')
    try {
      const result = salsa20Xor(
        hexToBytes(key),
        hexToBytes(nonce),
        new TextEncoder().encode(input),
      )
      setCiphertext(bytesToHex(result))
      setPhase('encrypted')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function handleDecrypt() {
    setErrorMsg('')
    try {
      const result = salsa20Xor(hexToBytes(key), hexToBytes(nonce), hexToBytes(ciphertext))
      setPlaintext(new TextDecoder().decode(result))
      setPhase('decrypted')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
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
          value={nonce}
          onChange={(event) => setNonce(event.target.value)}
          placeholder="Nonce (hex)…"
          className="explorer-input"
          readOnly={phase !== 'encrypt'}
        />
        <button
          type="button"
          onClick={() => setNonce(randomHex(NONCE_BYTES))}
          disabled={phase !== 'encrypt'}
          className="cost-button"
        >
          Randomise nonce
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
            disabled={!input}
            className="compute-button"
          >
            Encrypt
          </button>
        </>
      )}

      {phase !== 'encrypt' && (
        <p className="hash-result">
          Ciphertext <code>{ciphertext}</code>
        </p>
      )}

      {phase === 'encrypted' && (
        <button type="button" onClick={handleDecrypt} className="compute-button">
          Decrypt
        </button>
      )}

      {phase === 'decrypted' && (
        <p className="hash-result">
          Plaintext <code>{plaintext}</code>
        </p>
      )}

      {errorMsg && <p className="hash-result">Error: {errorMsg}</p>}

      {phase !== 'encrypt' && (
        <button type="button" onClick={handleReset} className="cost-button">
          Start over
        </button>
      )}

      <p className="demo-note">
        Encrypt and decrypt are the exact same operation here - XORing the
        key stream a second time undoes the first XOR. Never reuse a
        key/nonce pair for two different messages: the key stream would
        repeat, and XORing the two ciphertexts together cancels it out
        entirely.
      </p>
    </div>
  )
}

export default Salsa20CipherLab
