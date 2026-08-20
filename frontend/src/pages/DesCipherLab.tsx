import { useState } from 'react'
import {
  hexToText,
  opensslDecrypt,
  opensslEncrypt,
  randomHex,
  textToHex,
} from '../lib/opensslDemo'

const ALGORITHMS = {
  DES: { cipher: 'des-cbc', keyBytes: 8 },
  '3DES': { cipher: 'des-ede3-cbc', keyBytes: 24 },
} as const

type AlgoName = keyof typeof ALGORITHMS
type Phase = 'encrypt' | 'encrypted' | 'decrypted'

function DesCipherLab() {
  const [algo, setAlgo] = useState<AlgoName>('DES')
  const [key, setKey] = useState(() => randomHex(ALGORITHMS.DES.keyBytes))
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

  function handleAlgoChange(name: AlgoName) {
    setAlgo(name)
    setKey(randomHex(ALGORITHMS[name].keyBytes))
    handleReset()
  }

  async function handleEncrypt() {
    if (!input) return
    setStatus('loading')
    setErrorMsg('')
    const response = await opensslEncrypt({
      cipher: ALGORITHMS[algo].cipher,
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
      cipher: ALGORITHMS[algo].cipher,
      keyHex: key,
      ivHex: iv,
      dataHex: ciphertext,
    })
    setStatus('idle')
    if (response.ok && response.dataHex !== undefined) {
      setPlaintext(hexToText(response.dataHex))
      setPhase('decrypted')
    } else {
      // Stay on the "encrypted" phase so a wrong key/IV can be fixed and
      // retried without losing the ciphertext.
      setErrorMsg(response.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>

      <div className="cost-selector">
        {(Object.keys(ALGORITHMS) as AlgoName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleAlgoChange(name)}
            className={
              name === algo ? 'cost-button cost-button-active' : 'cost-button'
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
          onClick={() => setKey(randomHex(ALGORITHMS[algo].keyBytes))}
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
        3DES here uses three independent keys (24 bytes) run as
        encrypt-decrypt-encrypt. The key and IV lock once you encrypt -
        decryption always needs the exact same ones used to encrypt.
      </p>
    </div>
  )
}

export default DesCipherLab
