import { decrypt, encrypt, makeSession } from 'twofish-ts'

// twofish-ts only implements the raw 16-byte block cipher (verified against
// the official Schneier ecb_ival.txt test vectors for 128-bit and 192-bit
// keys). CBC chaining and PKCS#7 padding are implemented here on top of it,
// since OpenSSL has never implemented Twofish at all - there's nothing to
// wrap or cross-check against, so this is verified by round-trip testing
// instead (short messages, multi-block messages, exact-block-size messages,
// and wrong-key decryption all confirmed to behave correctly).
const BLOCK_SIZE = 16

function pkcs7Pad(data: Uint8Array): Uint8Array {
  const padLength = BLOCK_SIZE - (data.length % BLOCK_SIZE)
  const out = new Uint8Array(data.length + padLength)
  out.set(data)
  out.fill(padLength, data.length)
  return out
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  const padLength = data[data.length - 1]
  if (padLength < 1 || padLength > BLOCK_SIZE || padLength > data.length) {
    throw new Error('invalid padding')
  }
  for (let i = data.length - padLength; i < data.length; i++) {
    if (data[i] !== padLength) throw new Error('invalid padding')
  }
  return data.slice(0, data.length - padLength)
}

function xorBlock(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(BLOCK_SIZE)
  for (let i = 0; i < BLOCK_SIZE; i++) out[i] = a[i] ^ b[i]
  return out
}

export function twofishEncryptCbc(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
): Uint8Array {
  const session = makeSession(key)
  const padded = pkcs7Pad(plaintext)
  const out = new Uint8Array(padded.length)
  let prevBlock = iv
  for (let i = 0; i < padded.length; i += BLOCK_SIZE) {
    const xored = xorBlock(padded.slice(i, i + BLOCK_SIZE), prevBlock)
    const cipherBlock = new Uint8Array(BLOCK_SIZE)
    encrypt(xored, 0, cipherBlock, 0, session)
    out.set(cipherBlock, i)
    prevBlock = cipherBlock
  }
  return out
}

export function twofishDecryptCbc(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Uint8Array {
  if (ciphertext.length === 0 || ciphertext.length % BLOCK_SIZE !== 0) {
    throw new Error('ciphertext length must be a multiple of the block size')
  }
  const session = makeSession(key)
  const out = new Uint8Array(ciphertext.length)
  let prevBlock = iv
  for (let i = 0; i < ciphertext.length; i += BLOCK_SIZE) {
    const cipherBlock = ciphertext.slice(i, i + BLOCK_SIZE)
    const decryptedBlock = new Uint8Array(BLOCK_SIZE)
    decrypt(cipherBlock, 0, decryptedBlock, 0, session)
    out.set(xorBlock(decryptedBlock, prevBlock), i)
    prevBlock = cipherBlock
  }
  return pkcs7Unpad(out)
}
