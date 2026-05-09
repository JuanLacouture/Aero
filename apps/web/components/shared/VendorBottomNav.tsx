'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/vendor/orders', icon: ClipboardList, label: 'Pedidos' },
  { href: '/vendor/menu', icon: UtensilsCrossed, label: 'Menú' },
  { href: '/vendor/reports', icon: BarChart2, label: 'Reportes' },
  { href: '/vendor/profile', icon: User, label: 'Perfil' },
]

export default function VendorBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border max-w-lg mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
                active ? 'text-vendor' : 'text-text-secondary'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
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
