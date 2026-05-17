'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Logo + badge */}
      <Link href="/vendor/dashboard" className="shrink-0 mr-10 flex items-center gap-3">
        <Image src="/logo-aero.jpg" alt="Aero" width={80} height={32} className="h-7 w-auto" />
        <span className="text-vendor text-xs font-body font-semibold bg-vendor/10 px-2.5 py-1 rounded-full">
          Vendedor
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-display font-semibold transition-all duration-200',
                active
                  ? 'bg-vendor/10 text-vendor'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
