export interface Topic {
  slug: string
  name: string
}

export const topics: Topic[] = [
  { slug: 'encoding', name: 'Encoding' },
  { slug: 'hashing', name: 'Hashing' },
  { slug: 'symmetric-encryption', name: 'Symmetric Encryption' },
  { slug: 'public-key-encryption', name: 'Public Key Encryption' },
  { slug: 'key-exchange', name: 'Key Exchange' },
  { slug: 'certificates', name: 'Certificates' },
  { slug: 'post-quantum-cryptography', name: 'Post-Quantum Cryptography' },
]
