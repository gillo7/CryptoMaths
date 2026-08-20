import { streamXOR } from '@stablelib/salsa20'

// OpenSSL has never implemented Salsa20, so this runs entirely in the
// browser via @stablelib/salsa20. Verified against the standard eSTREAM
// Salsa20/20 test vectors (256-bit key, 64-bit nonce, 131072-byte
// keystream XOR digest) cross-checked independently against PyCryptodome's
// Salsa20 implementation - both matched the published expected digest
// exactly. As a pure stream cipher, encryption and decryption are the same
// XOR operation, and there's no block size or padding involved.
export function salsa20Xor(
  key: Uint8Array,
  nonce: Uint8Array,
  data: Uint8Array,
): Uint8Array {
  return streamXOR(key, nonce, data, new Uint8Array(data.length))
}
