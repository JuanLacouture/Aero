import StudentBottomNav from '@/components/shared/StudentBottomNav'
import PushSubscriptionInit from '@/components/shared/PushSubscriptionInit'
import ActiveOrderBubble from '@/components/shared/ActiveOrderBubble'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <PushSubscriptionInit />
      <ActiveOrderBubble />
      <main className="pb-20">{children}</main>
      <StudentBottomNav />
    </div>
  )
}
