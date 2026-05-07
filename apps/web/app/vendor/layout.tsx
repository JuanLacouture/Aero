export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-vendor-background)' }}>
      {children}
    </div>
  )
}
