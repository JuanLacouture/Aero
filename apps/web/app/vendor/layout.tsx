import VendorBottomNav from '@/components/shared/VendorBottomNav'
import SessionGuard from '@/components/shared/SessionGuard'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vendor-background max-w-lg mx-auto relative">
      <SessionGuard role="vendor" />
      <main className="pb-20">{children}</main>
      <VendorBottomNav />
    </div>
  )
}
