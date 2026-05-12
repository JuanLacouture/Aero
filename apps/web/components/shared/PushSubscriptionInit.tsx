'use client'

import { usePushSubscription } from '@/lib/hooks/usePushSubscription'

export default function PushSubscriptionInit() {
  usePushSubscription()
  return null
}
