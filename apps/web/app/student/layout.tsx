import StudentBottomNav from '@/components/shared/StudentBottomNav'
import StudentTopNav from '@/components/shared/StudentTopNav'
import PushSubscriptionInit from '@/components/shared/PushSubscriptionInit'
import ActiveOrderBubble from '@/components/shared/ActiveOrderBubble'
import SessionGuard from '@/components/shared/SessionGuard'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative">
      <SessionGuard role="student" />
      <PushSubscriptionInit />
      <ActiveOrderBubble />
      <StudentTopNav />
      <main className="pb-20 md:pb-0 md:pt-16">{children}</main>
      <StudentBottomNav />
    </div>
  )
}
