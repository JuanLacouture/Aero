'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, ClipboardList, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/stores/cart'

const NAV_ITEMS = [
  { href: '/student/home', icon: Home, label: 'Inicio' },
  { href: '/student/order/new', icon: ShoppingBag, label: 'Pedido' },
  { href: '/student/orders', icon: ClipboardList, label: 'Mis pedidos' },
  { href: '/student/wallet', icon: Wallet, label: 'Cartera' },
  { href: '/student/profile', icon: User, label: 'Perfil' },
]

export default function StudentBottomNav() {
  const pathname = usePathname()
  const cartCount = useCartStore(s => s.count())

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border max-w-lg mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          const isOrder = href.includes('order')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors relative',
                active ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {isOrder && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-display font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={cn('text-xs font-body', active ? 'font-semibold' : 'font-normal')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
