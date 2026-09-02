import { useState } from 'react'
import { fetchBenchmark, type SpeedResult } from '../lib/pqcDemo'

interface CatalogEntry {
  id: string
  label: string
  category: string
}

const SLH_DSA_VARIANTS = [
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-256s',
] as const

const slhDsaEntries = (category: string): CatalogEntry[] =>
  SLH_DSA_VARIANTS.map((v) => ({ id: v.toLowerCase(), label: v, category }))

const KEYGEN_CATALOG: CatalogEntry[] = [
  { id: 'x25519', label: 'X25519', category: 'Classical' },
  { id: 'p256', label: 'P-256', category: 'Classical' },
  { id: 'ed25519', label: 'Ed25519', category: 'Classical' },
  { id: 'rsa2048', label: 'RSA-2048', category: 'Classical' },
  { id: 'mlkem512', label: 'ML-KEM-512', category: 'ML-KEM' },
  { id: 'mlkem768', label: 'ML-KEM-768', category: 'ML-KEM' },
  { id: 'mlkem1024', label: 'ML-KEM-1024', category: 'ML-KEM' },
  { id: 'hqc128', label: 'HQC-128', category: 'HQC' },
  { id: 'hqc192', label: 'HQC-192', category: 'HQC' },
  { id: 'hqc256', label: 'HQC-256', category: 'HQC' },
  { id: 'frodokem640', label: 'FrodoKEM-640-SHAKE', category: 'FrodoKEM' },
  { id: 'frodokem976', label: 'FrodoKEM-976-SHAKE', category: 'FrodoKEM' },
  { id: 'frodokem1344', label: 'FrodoKEM-1344-SHAKE', category: 'FrodoKEM' },
  { id: 'hybrid', label: 'X25519 + ML-KEM-768 (hybrid)', category: 'Hybrid' },
  { id: 'mldsa44', label: 'ML-DSA-44', category: 'ML-DSA' },
  { id: 'mldsa65', label: 'ML-DSA-65', category: 'ML-DSA' },
  { id: 'mldsa87', label: 'ML-DSA-87', category: 'ML-DSA' },
  { id: 'falcon512', label: 'Falcon-512', category: 'FN-DSA' },
  { id: 'falcon1024', label: 'Falcon-1024', category: 'FN-DSA' },
  ...slhDsaEntries('SLH-DSA'),
]

const ENCAP_DECAP_CATALOG: CatalogEntry[] = [
  { id: 'mlkem512', label: 'ML-KEM-512', category: 'ML-KEM' },
  { id: 'mlkem768', label: 'ML-KEM-768', category: 'ML-KEM' },
  { id: 'mlkem1024', label: 'ML-KEM-1024', category: 'ML-KEM' },
  { id: 'hqc128', label: 'HQC-128', category: 'HQC' },
  { id: 'hqc192', label: 'HQC-192', category: 'HQC' },
  { id: 'hqc256', label: 'HQC-256', category: 'HQC' },
  { id: 'frodokem640', label: 'FrodoKEM-640-SHAKE', category: 'FrodoKEM' },
  { id: 'frodokem976', label: 'FrodoKEM-976-SHAKE', category: 'FrodoKEM' },
  { id: 'frodokem1344', label: 'FrodoKEM-1344-SHAKE', category: 'FrodoKEM' },
  { id: 'hybrid', label: 'X25519 + ML-KEM-768 (hybrid)', category: 'Hybrid' },
]

const SIGN_VERIFY_CATALOG: CatalogEntry[] = [
  { id: 'ed25519', label: 'Ed25519', category: 'Classical' },
  { id: 'rsapss2048', label: 'RSA-PSS (2048-bit)', category: 'Classical' },
  { id: 'mldsa44', label: 'ML-DSA-44', category: 'ML-DSA' },
  { id: 'mldsa65', label: 'ML-DSA-65', category: 'ML-DSA' },
  { id: 'mldsa87', label: 'ML-DSA-87', category: 'ML-DSA' },
  { id: 'falcon512', label: 'Falcon-512', category: 'FN-DSA' },
  { id: 'falcon1024', label: 'Falcon-1024', category: 'FN-DSA' },
  ...slhDsaEntries('SLH-DSA'),
]

const TLS_CATALOG: CatalogEntry[] = [
  { id: 'classical-x25519-ed25519', label: 'Classical (X25519 + Ed25519)', category: 'Connection profile' },
  { id: 'classical-p256-rsa', label: 'Classical (P-256 + RSA-2048)', category: 'Connection profile' },
  { id: 'mlkem768-mldsa65', label: 'Fully post-quantum (ML-KEM-768 + ML-DSA-65)', category: 'Connection profile' },
  { id: 'hybrid-mldsa65', label: 'Hybrid + ML-DSA-65 (recommended migration path)', category: 'Connection profile' },
  { id: 'hybrid-classical-sig', label: 'Hybrid + classical signature (X25519MLKEM768 + ECDSA P-256)', category: 'Connection profile' },
]

type OperationId = 'keygen' | 'encap-decap' | 'sign-verify' | 'tls'

const OPERATIONS: {
  id: OperationId
  label: string
  catalog: CatalogEntry[]
  loadingHint: string
}[] = [
  { id: 'keygen', label: 'Key generation', catalog: KEYGEN_CATALOG, loadingHint: 'Generating real keypairs…' },
  {
    id: 'encap-decap',
    label: 'Encapsulate / Decapsulate',
    catalog: ENCAP_DECAP_CATALOG,
    loadingHint: 'Running real encapsulate/decapsulate rounds…',
  },
  { id: 'sign-verify', label: 'Sign / Verify', catalog: SIGN_VERIFY_CATALOG, loadingHint: 'Signing and verifying for real…' },
  {
    id: 'tls',
    label: 'Full TLS connection',
    catalog: TLS_CATALOG,
    loadingHint: 'Completing real TLS 1.3 handshakes…',
  },
]

function groupByCategory(catalog: CatalogEntry[]): [string, CatalogEntry[]][] {
  const map = new Map<string, CatalogEntry[]>()
  for (const entry of catalog) {
    if (!map.has(entry.category)) map.set(entry.category, [])
    map.get(entry.category)?.push(entry)
  }
  return [...map.entries()]
}

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
  if (ms < 1000) return `${ms.toFixed(1)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function PqcBenchmark() {
  const [operation, setOperation] = useState<OperationId>('keygen')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [results, setResults] = useState<SpeedResult[] | null>(null)

  const current = OPERATIONS.find((o) => o.id === operation) ?? OPERATIONS[0]

  function switchOperation(op: OperationId) {
    setOperation(op)
    setSelected(new Set())
    setResults(null)
    setStatus('idle')
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRun() {
    if (selected.size === 0) return
    setStatus('loading')
    setResults(null)
    try {
      const data = await fetchBenchmark(current.id, [...selected])
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
        Pick an operation, pick any algorithms to compare, then run
        them all for real, back to back, on this server - the same
        real crypto behind every demo elsewhere in this chapter, just
        gathered in one place.
      </p>

      <div className="cost-selector">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => switchOperation(op.id)}
            disabled={status === 'loading'}
            className={op.id === operation ? 'cost-button cost-button-active' : 'cost-button'}
          >
            {op.label}
          </button>
        ))}
      </div>

      {groupByCategory(current.catalog).map(([category, entries]) => (
        <div key={category}>
          {current.id !== 'tls' && (
            <p className="demo-note">
              <strong>{category}</strong>
            </p>
          )}
          <div className="cost-selector">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => toggle(entry.id)}
                disabled={status === 'loading'}
                className={selected.has(entry.id) ? 'cost-button cost-button-active' : 'cost-button'}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleRun}
        disabled={status === 'loading' || selected.size === 0}
        className="compute-button"
      >
        {status === 'loading'
          ? current.loadingHint
          : selected.size > 0
            ? `Run (${selected.size} selected)`
            : 'Select at least one to run'}
      </button>

      {status === 'error' && (
        <p className="hash-result">Something went wrong - try again.</p>
      )}

      {results && (
        <div className="multibox">
          {results.map((r) => (
            <div className="multibox-row" key={r.label}>
              <span className="multibox-label">{r.label}</span>
              <code className="multibox-value">{formatMs(r.ms)}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PqcBenchmark
