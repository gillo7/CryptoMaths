function CertificatesPlaceholder({ label }: { label: string }) {
  return (
    <div className="content-placeholder">
      <span className="placeholder-badge">Coming soon</span>
      <p>{label}</p>
    </div>
  )
}

export default CertificatesPlaceholder
