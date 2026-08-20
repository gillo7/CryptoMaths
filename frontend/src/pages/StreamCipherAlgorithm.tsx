import { Link, Navigate, useParams } from 'react-router-dom'
import { streamCipherAlgorithms } from './streamCipherAlgorithms'
import './SymmetricEncryption.css'

function StreamCipherAlgorithm() {
  const { algo: slug } = useParams()
  const algo = streamCipherAlgorithms.find((a) => a.slug === slug)

  if (!algo) {
    return <Navigate to="/symmetric-encryption/stream-ciphers" replace />
  }

  return (
    <main className="symmetric-page">
      <Link to="/symmetric-encryption/stream-ciphers" className="back-link">
        ← Back to Stream Ciphers
      </Link>

      <h1>{algo.name}</h1>

      <section>{algo.content}</section>
    </main>
  )
}

export default StreamCipherAlgorithm
