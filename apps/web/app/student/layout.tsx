import StudentBottomNav from '@/components/shared/StudentBottomNav'
import PushSubscriptionInit from '@/components/shared/PushSubscriptionInit'
import ActiveOrderBubble from '@/components/shared/ActiveOrderBubble'
import SessionGuard from '@/components/shared/SessionGuard'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <SessionGuard role="student" />
      <PushSubscriptionInit />
      <ActiveOrderBubble />
      <main className="pb-20">{children}</main>
      <StudentBottomNav />
    </div>
  )
}
