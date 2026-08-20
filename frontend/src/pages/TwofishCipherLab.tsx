import { useState } from 'react'
import { bytesToHex, hexToBytes, randomHex } from '../lib/hexUtils'
import { twofishDecryptCbc, twofishEncryptCbc } from '../lib/twofishDemo'

const KEY_BYTES = 16
const IV_BYTES = 16

type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function TwofishCipherLab() {
  const [key, setKey] = useState(() => randomHex(KEY_BYTES))
  const [iv, setIv] = useState(() => randomHex(IV_BYTES))
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
      const result = twofishEncryptCbc(
        hexToBytes(key),
        hexToBytes(iv),
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
      const result = twofishDecryptCbc(hexToBytes(key), hexToBytes(iv), hexToBytes(ciphertext))
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
        128-bit block, same as AES - unlike DES/Blowfish's 64-bit block,
        this doesn't have the SWEET32-style repeated-block problem.
      </p>
    </div>
  )
}

export default TwofishCipherLab
