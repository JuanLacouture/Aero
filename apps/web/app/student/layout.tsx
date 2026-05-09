import StudentBottomNav from '@/components/shared/StudentBottomNav'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-20">{children}</main>
      <StudentBottomNav />
    </div>
  )
}
