import { Link, Navigate, useParams } from 'react-router-dom'
import { blockCipherAlgorithms } from './blockCipherAlgorithms'
import './SymmetricEncryption.css'

function BlockCipherAlgorithm() {
  const { algo: slug } = useParams()
  const algo = blockCipherAlgorithms.find((a) => a.slug === slug)

  if (!algo) {
    return <Navigate to="/symmetric-encryption/block-ciphers" replace />
  }

  return (
    <main className="symmetric-page">
      <Link to="/symmetric-encryption/block-ciphers" className="back-link">
        ← Back to Block Ciphers
      </Link>

      <h1>{algo.name}</h1>

      <section>{algo.content}</section>
    </main>
  )
}

export default BlockCipherAlgorithm
