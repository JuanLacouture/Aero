'use client'

import { useEffect } from 'react'

export function usePushSubscription() {
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey || typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    async function subscribe() {
      if (Notification.permission === 'denied') return

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // Already subscribed — ensure server has it
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: existing.toJSON() }),
          })
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
      } catch {
        // Silently fail — push is non-critical
      }
    }

    subscribe()
  }, [])
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
