'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, ClipboardList, Wallet, User, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/student/home', icon: Home, label: 'Inicio' },
  { href: '/student/map', icon: Map, label: 'Mapa' },
  { href: '/student/orders', icon: ClipboardList, label: 'Pedidos' },
  { href: '/student/wallet', icon: Wallet, label: 'Cartera' },
  { href: '/student/profile', icon: User, label: 'Perfil' },
]

export default function StudentTopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Logo */}
      <Link href="/student/home" className="shrink-0 mr-10">
        <span className="font-display font-extrabold italic text-primary text-2xl tracking-tight">Aero</span>
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
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right: location + avatar */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
          <MapPin size={13} className="text-primary shrink-0" />
          <span className="text-xs font-display font-semibold text-gray-700 whitespace-nowrap">
            Unisabana · Campus
          </span>
        </div>
        <Link
          href="/student/profile"
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
        >
          <User size={15} />
        </Link>
      </div>
    </nav>
  )
}
