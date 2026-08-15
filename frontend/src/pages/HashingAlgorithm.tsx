import { Link, Navigate, useParams } from 'react-router-dom'
import { hashingAlgorithms } from './hashingAlgorithms'
import './Hashing.css'

function HashingAlgorithm() {
  const { algo: slug } = useParams()
  const algo = hashingAlgorithms.find((a) => a.slug === slug)

  if (!algo) {
    return <Navigate to="/hashing" replace />
  }

  return (
    <main className="hashing-page">
      <Link to="/hashing" className="back-link">
        ← Back to Hashing
      </Link>

      <h1>{algo.name}</h1>

      <section>{algo.content}</section>
    </main>
  )
}

export default HashingAlgorithm
