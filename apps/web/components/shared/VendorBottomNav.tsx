'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart2, User } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-nav pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative"
            >
              <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(active ? 'text-vendor' : 'text-gray-400')}
                />
              </motion.div>
              <span className={cn(
                'text-xs font-body',
                active ? 'font-semibold text-vendor' : 'font-normal text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="vendorNavDot"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-vendor rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
