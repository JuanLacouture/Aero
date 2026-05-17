'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Logo */}
      <Link href="/student/home" className="shrink-0 mr-10">
        <Image src="/logo-aero.png" alt="Aero" width={80} height={32} className="h-7 w-auto" />
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
    </nav>
  )
}
