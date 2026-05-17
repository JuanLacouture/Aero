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

export default function VendorTopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-16 items-center px-6 shadow-sm">
      <Link href="/vendor/dashboard" className="flex items-center gap-2.5 mr-10 shrink-0">
        <div className="w-8 h-8 bg-vendor rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-display font-extrabold">A</span>
        </div>
        <span className="font-display font-bold text-text-primary text-base">AERO</span>
        <span className="text-vendor text-xs font-body font-semibold bg-vendor/10 px-2 py-0.5 rounded-full">
          Vendedor
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold transition-colors',
                active
                  ? 'bg-vendor/10 text-vendor'
                  : 'text-text-secondary hover:bg-vendor-background hover:text-text-primary'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
