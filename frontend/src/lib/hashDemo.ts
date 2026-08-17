import CryptoJS from 'crypto-js'
import { argon2id, bcrypt, md4, md5, scrypt, sha1, sha256, sha3 } from 'hash-wasm'

export interface HashResult {
  slug: string
  label: string
  value: string
}

// LM hash: password -> uppercase, null-padded/truncated to 14 bytes, split into
// two 7-byte halves, each expanded to an 8-byte DES key and used to encrypt the
// fixed string "KGS!@#$%". Verified against known test vectors: LM("") ==
// AAD3B435B51404EEAAD3B435B51404EE and LM("PASSWORD") == E52CAC67419A9A224A3B108F3FA6CB6D.
function strToDesKey(half: number[]): number[] {
  const key = new Array(8)
  key[0] = half[0] >> 1
  key[1] = ((half[0] & 0x01) << 6) | (half[1] >> 2)
  key[2] = ((half[1] & 0x03) << 5) | (half[2] >> 3)
  key[3] = ((half[2] & 0x07) << 4) | (half[3] >> 4)
  key[4] = ((half[3] & 0x0f) << 3) | (half[4] >> 5)
  key[5] = ((half[4] & 0x1f) << 2) | (half[5] >> 6)
  key[6] = ((half[5] & 0x3f) << 1) | (half[6] >> 7)
  key[7] = half[6] & 0x7f
  for (let i = 0; i < 8; i++) key[i] = (key[i] << 1) & 0xfe
  return key
}

function desEncryptFixedString(keyBytes: number[]): string {
  const key = CryptoJS.lib.WordArray.create(new Uint8Array(keyBytes))
  const plaintext = CryptoJS.enc.Latin1.parse('KGS!@#$%')
  const encrypted = CryptoJS.DES.encrypt(plaintext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.NoPadding,
  })
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex)
}

export function lmHash(password: string): string {
  const upper = password.toUpperCase()
  const bytes = new Array(14).fill(0)
  for (let i = 0; i < Math.min(14, upper.length); i++) {
    bytes[i] = upper.charCodeAt(i) & 0xff
  }
  const half1 = desEncryptFixedString(strToDesKey(bytes.slice(0, 7)))
  const half2 = desEncryptFixedString(strToDesKey(bytes.slice(7, 14)))
  return (half1 + half2).toUpperCase()
}

// NTLM hash: MD4 of the password encoded as UTF-16LE.
// Verified against NTLM("") == 31D6CFE0D16AE931B73C59D7E0C089C0
// and NTLM("password") == 8846F7EAEE8FB117AD06BDD830B7586C.
function utf16leBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length * 2)
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    out[i * 2] = code & 0xff
    out[i * 2 + 1] = (code >> 8) & 0xff
  }
  return out
}

export async function ntlmHash(password: string): Promise<string> {
  return md4(utf16leBytes(password))
}

// Reduced cost parameters so the demo stays responsive on a click - not
// representative of real-world recommended settings for these algorithms.
const DEMO_BCRYPT_COST = 10
const DEMO_SCRYPT_PARAMS = { costFactor: 1024, blockSize: 8, parallelism: 1 }
const DEMO_ARGON2_PARAMS = { parallelism: 1, iterations: 2, memorySize: 1024 }

export async function computeAllHashes(password: string): Promise<HashResult[]> {
  const randomSalt = () => crypto.getRandomValues(new Uint8Array(16))

  const [md5Hash, sha1Hash, sha256Hash, sha3Hash, ntlmHashValue, bcryptHash, scryptHash, argon2Hash] =
    await Promise.all([
      md5(password),
      sha1(password),
      sha256(password),
      sha3(password, 256),
      ntlmHash(password),
      bcrypt({
        password,
        salt: randomSalt(),
        costFactor: DEMO_BCRYPT_COST,
        outputType: 'encoded',
      }),
      scrypt({
        password,
        salt: randomSalt(),
        ...DEMO_SCRYPT_PARAMS,
        hashLength: 32,
        outputType: 'hex',
      }),
      argon2id({
        password,
        salt: randomSalt(),
        ...DEMO_ARGON2_PARAMS,
        hashLength: 32,
        outputType: 'hex',
      }),
    ])

  return [
    { slug: 'md5', label: 'MD5', value: md5Hash },
    { slug: 'lm', label: 'LM', value: lmHash(password) },
    { slug: 'ntlm', label: 'NTLM', value: ntlmHashValue },
    { slug: 'sha-1', label: 'SHA-1', value: sha1Hash },
    { slug: 'sha-2', label: 'SHA-2', value: sha256Hash },
    { slug: 'sha-3', label: 'SHA-3', value: sha3Hash },
    { slug: 'bcrypt', label: 'Bcrypt', value: bcryptHash },
    { slug: 'scrypt', label: 'Scrypt', value: scryptHash },
    { slug: 'argon2', label: 'Argon2id', value: argon2Hash },
  ]
}
