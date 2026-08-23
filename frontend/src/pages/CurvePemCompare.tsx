import { Fragment, useState } from 'react'
import { generateAllCurveKeys, type CurvePem } from '../lib/curveCompareDemo'

function CurvePemCompare() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<CurvePem[] | null>(null)

  async function handleRun() {
    setStatus('loading')
    setResults(null)
    try {
      const data = await generateAllCurveKeys()
      setResults(data)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <p>
        A real key pair on every curve above, side by side - the length
        difference here is the key size difference from the table above,
        made visible.
      </p>
      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading'}
        className="compute-button"
      >
        {status === 'loading' ? 'Generating…' : 'Generate a key on every curve'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {results?.map((r) => (
        <Fragment key={r.curve}>
          <p className="demo-note">
            <strong>{r.curve}</strong>
          </p>
          <div className="code-block">
            <code>
              {r.publicPem.trim()}
              {'\n\n'}
              {r.privatePem.trim()}
            </code>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

export default CurvePemCompare
