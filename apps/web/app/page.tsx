'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingBag, CreditCard, Package, Star, Users, Store } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/logo-aero.jpg" alt="Aero" width={80} height={32} className="h-8 w-auto" priority />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-display font-semibold text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-display font-bold bg-primary text-white rounded-xl px-4 py-2 hover:brightness-110 transition-all shadow-blue"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-primary/8 text-primary text-sm font-display font-semibold px-4 py-1.5 rounded-full">
                🎓 Universidad de La Sabana
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-gray-900 leading-[1.1] tracking-tight"
            >
              Tu comida universitaria,{' '}
              <span className="text-primary">sin filas</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-gray-500 font-body leading-relaxed max-w-md"
            >
              Pide a los vendedores del campus, paga con tu saldo y recoge cuando esté listo.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-display font-bold rounded-xl px-6 py-3.5 text-base shadow-blue hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Crear cuenta gratis →
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-gray-600 font-display font-semibold rounded-xl px-6 py-3.5 text-base border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all"
              >
                Ya tengo cuenta
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2 flex-wrap">
              {[
                { value: '2,400+', label: 'estudiantes' },
                { value: '40+', label: 'vendedores' },
                { value: '4.8★', label: 'promedio' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <span className="text-sm font-display font-bold text-gray-900">{stat.value}</span>
                  <span className="text-sm text-gray-400 font-body">{stat.label}</span>
                  {i < 2 && <span className="text-gray-200 ml-2">·</span>}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center justify-center relative"
          >
            {/* Blob background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[3rem] blur-3xl scale-110" />

            {/* Phone */}
            <div className="relative w-72 bg-white rounded-[2.5rem] border-[10px] border-gray-900 shadow-[0_32px_64px_rgba(0,0,0,0.25)] overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-2xl z-10" />
              {/* Status bar */}
              <div className="bg-gradient-to-br from-primary to-primary-dark px-4 pt-6 pb-5">
                <p className="text-white/70 text-[10px] font-body uppercase tracking-widest">AERO · La Sabana</p>
                <p className="text-white text-base font-display font-extrabold mt-1">Buenos días, María 👋</p>
                <p className="text-blue-200 text-[11px] font-body mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  5 vendedores disponibles
                </p>
              </div>
              {/* Search bar */}
              <div className="mx-3 -mt-3 bg-white rounded-xl shadow-card px-3 py-2 flex items-center gap-2 mb-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span className="text-gray-400 text-[11px] font-body">Buscar vendedores...</span>
              </div>
              {/* Mock cards grid */}
              <div className="grid grid-cols-2 gap-2 px-3 pb-4">
                {[
                  { name: 'Café Campus', emoji: '☕', color: 'from-amber-400 to-orange-400', rating: '4.9', tag: 'Abierto' },
                  { name: 'Arepas y Más', emoji: '🫓', color: 'from-green-400 to-emerald-500', rating: '4.8', tag: 'Abierto' },
                  { name: 'Sandwich Co.', emoji: '🥪', color: 'from-blue-400 to-indigo-400', rating: '4.7', tag: 'Abierto' },
                  { name: 'Jugos Fresh', emoji: '🧃', color: 'from-pink-400 to-rose-400', rating: '4.6', tag: 'Cerrado' },
                ].map((v) => (
                  <div key={v.name} className="bg-white rounded-xl shadow-card overflow-hidden">
                    <div className={`h-16 bg-gradient-to-br ${v.color} flex items-center justify-center text-2xl relative`}>
                      {v.emoji}
                      <span className={`absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        v.tag === 'Abierto' ? 'bg-green-500 text-white' : 'bg-gray-800/60 text-white'
                      }`}>{v.tag}</span>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-display font-bold text-gray-900 truncate">{v.name}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star size={8} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[9px] text-gray-400">{v.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute top-8 -right-4 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-2"
            >
              <span className="text-success text-sm">✓</span>
              <span className="text-xs font-display font-semibold text-gray-900">¡Pedido listo!</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-12 -left-6 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-1.5"
            >
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-display font-semibold text-gray-900">4.9 Estrella</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-extrabold text-gray-900">Cómo funciona</h2>
            <p className="text-gray-500 font-body mt-2">Tres pasos y ya tienes tu pedido</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Store, step: '01', title: 'Elige tu vendedor', desc: 'Explora los vendedores del campus y su menú del día', color: 'bg-blue-100 text-primary' },
              { icon: CreditCard, step: '02', title: 'Paga con tu saldo', desc: 'Usa tu billetera Aero para pagar de forma segura y rápida', color: 'bg-purple-100 text-purple-600' },
              { icon: Package, step: '03', title: 'Recoge cuando esté listo', desc: 'Te avisamos cuando tu pedido esté listo para recoger', color: 'bg-green-100 text-green-600' },
            ].map(({ icon: Icon, step, title, desc, color }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-card"
              >
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-mono text-gray-400 font-semibold">{step}</span>
                <h3 className="text-base font-display font-bold text-gray-900 mt-1">{title}</h3>
                <p className="text-sm text-gray-500 font-body mt-1.5 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 text-white"
            >
              <Users size={28} className="mb-4 opacity-90" />
              <h3 className="text-xl font-display font-extrabold mb-2">Para estudiantes</h3>
              <ul className="text-blue-100 font-body text-sm space-y-2 mb-6">
                <li>✓ Explora vendedores del campus</li>
                <li>✓ Paga con billetera digital</li>
                <li>✓ Sigue tu pedido en tiempo real</li>
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-primary font-display font-bold rounded-xl px-5 py-2.5 text-sm hover:shadow-lg transition-all"
              >
                Soy estudiante →
              </Link>
            </motion.div>

            {/* Vendor */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-vendor to-vendor-dark rounded-2xl p-8 text-white"
            >
              <ShoppingBag size={28} className="mb-4 opacity-90" />
              <h3 className="text-xl font-display font-extrabold mb-2">Para vendedores</h3>
              <ul className="text-orange-100 font-body text-sm space-y-2 mb-6">
                <li>✓ Gestiona pedidos en tiempo real</li>
                <li>✓ Administra tu menú fácilmente</li>
                <li>✓ Reportes de ventas e ingresos</li>
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-vendor font-display font-bold rounded-xl px-5 py-2.5 text-sm hover:shadow-lg transition-all"
              >
                Soy vendedor →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display font-extrabold italic text-white/80 text-2xl tracking-tight">Aero</p>
          <p className="text-gray-500 text-sm font-body text-center">
            © 2026 Universidad de La Sabana · Capstone 2026-1
          </p>
        </div>
      </footer>
    </div>
  )
}
