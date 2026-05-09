import VendorBottomNav from '@/components/shared/VendorBottomNav'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vendor-background max-w-lg mx-auto relative">
      <main className="pb-20">{children}</main>
      <VendorBottomNav />
    </div>
  )
}
