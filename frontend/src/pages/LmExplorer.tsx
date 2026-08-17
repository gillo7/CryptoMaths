import { useState } from 'react'
import { lmHash } from '../lib/hashDemo'

const EMPTY_HALF = 'AAD3B435B51404EE'

function LmExplorer() {
  const [password, setPassword] = useState('Pass1')
  const hash = lmHash(password)
  const half1 = hash.slice(0, 16)
  const half2 = hash.slice(16, 32)

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Type a password…"
        className="explorer-input"
        maxLength={14}
      />
      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Uppercase</span>
          <code className="multibox-value">{password.toUpperCase()}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Half 1</span>
          <code className="multibox-value">{half1}</code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Half 2</span>
          <code className="multibox-value">
            {half2}
            {half2 === EMPTY_HALF ? ' - empty half, the fixed pattern' : ''}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">LM hash</span>
          <code className="multibox-value">{hash}</code>
        </div>
      </div>
    </div>
  )
}

export default LmExplorer
