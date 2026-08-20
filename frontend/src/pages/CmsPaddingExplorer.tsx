import { type ReactNode, useState } from 'react'

const BLOCK_SIZES = [8, 16]

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ')
}

function CmsPaddingExplorer() {
  const [text, setText] = useState('')
  const [blockSize, setBlockSize] = useState(16)

  const dataBytes = Array.from(new TextEncoder().encode(text))
  const remainder = dataBytes.length % blockSize
  const padLength = blockSize - remainder
  const padBytes = new Array(padLength).fill(padLength)
  const paddedBytes = [...dataBytes, ...padBytes]

  const paddedHexParts: ReactNode[] = []
  paddedBytes.forEach((byte, i) => {
    if (i > 0) paddedHexParts.push(' ')
    const hex = byte.toString(16).padStart(2, '0')
    paddedHexParts.push(
      i >= dataBytes.length ? <mark key={i}>{hex}</mark> : hex,
    )
  })

  return (
    <div className="explorer">
      <span className="exercise-badge">Explore</span>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type something…"
        className="explorer-input"
      />

      <div className="cost-selector">
        {BLOCK_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setBlockSize(size)}
            className={
              size === blockSize ? 'cost-button cost-button-active' : 'cost-button'
            }
          >
            {size}-byte blocks
          </button>
        ))}
      </div>

      <div className="multibox">
        <div className="multibox-row">
          <span className="multibox-label">Data</span>
          <code className="multibox-value">
            {dataBytes.length ? bytesToHex(dataBytes) : '-'} ({dataBytes.length}{' '}
            bytes)
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Padding</span>
          <code className="multibox-value">
            {padLength} byte{padLength === 1 ? '' : 's'} of{' '}
            {padLength.toString(16).padStart(2, '0')}
          </code>
        </div>
        <div className="multibox-row">
          <span className="multibox-label">Padded block(s)</span>
          <code className="multibox-value">
            {paddedBytes.length ? paddedHexParts : '-'}
          </code>
        </div>
      </div>

      <p className="demo-note">
        CMS/PKCS#7 padding always adds at least 1 byte, and every padding
        byte's value equals how many were added - if your data already
        fills the block exactly, a whole extra block of padding is added
        anyway, so the padding is never ambiguous with real data.
      </p>
    </div>
  )
}

export default CmsPaddingExplorer
