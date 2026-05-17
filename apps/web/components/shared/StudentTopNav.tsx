'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, ClipboardList, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/student/home', icon: Home, label: 'Inicio' },
  { href: '/student/favorites', icon: Heart, label: 'Favoritos' },
  { href: '/student/orders', icon: ClipboardList, label: 'Mis pedidos' },
  { href: '/student/wallet', icon: Wallet, label: 'Cartera' },
  { href: '/student/profile', icon: User, label: 'Perfil' },
]

export default function StudentTopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-16 items-center px-6 shadow-sm">
      <Link href="/student/home" className="flex items-center gap-2.5 mr-10 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white text-sm font-display font-extrabold">A</span>
        </div>
        <span className="font-display font-bold text-text-primary text-base">AERO</span>
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
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
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
