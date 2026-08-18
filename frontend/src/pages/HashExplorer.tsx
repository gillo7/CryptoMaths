import { useState } from 'react'
import { computeAllHashes, type HashResult } from '../lib/hashDemo'

function HashExplorer() {
  const [password, setPassword] = useState('')
  const [results, setResults] = useState<HashResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCompute() {
    setLoading(true)
    try {
      setResults(await computeAllHashes(password))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <div className="hash-input-row">
        <input
          type="text"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Type a password…"
          className="explorer-input"
        />
        <button
          type="button"
          onClick={handleCompute}
          disabled={loading || !password}
          className="compute-button"
        >
          {loading ? 'Computing…' : 'Compute Hashes'}
        </button>
      </div>

      {results && (
        <div className="multibox">
          {results.map((result) => (
            <div className="multibox-row" key={result.slug}>
              <span className="multibox-label">{result.label}</span>
              <code className="multibox-value">{result.value}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HashExplorer
