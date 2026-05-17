import VendorBottomNav from '@/components/shared/VendorBottomNav'
import VendorTopNav from '@/components/shared/VendorTopNav'
import SessionGuard from '@/components/shared/SessionGuard'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vendor-background relative">
      <SessionGuard role="vendor" />
      <VendorTopNav />
      <main className="pb-20 md:pb-0 md:pt-16">{children}</main>
      <VendorBottomNav />
    </div>
  )
}
