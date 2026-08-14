export interface Topic {
  slug: string
  name: string
}

export const topics: Topic[] = [
  { slug: 'encoding', name: 'Encoding' },
  { slug: 'hashing', name: 'Hashing' },
  { slug: 'symmetric-encryption', name: 'Symmetric Encryption' },
  { slug: 'asymmetric-encryption', name: 'Asymmetric Encryption' },
  { slug: 'signatures-and-certificates', name: 'Signatures and Certificates' },
  { slug: 'post-quantum-cryptography', name: 'Post-Quantum Cryptography' },
]
