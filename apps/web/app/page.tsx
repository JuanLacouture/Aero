import Link from 'next/link'

export default function SplashPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-primary w-full px-6 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 md:w-[500px] md:h-[500px] rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 md:w-96 md:h-96 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-1/2 right-[-120px] w-64 h-64 rounded-full bg-white/5 pointer-events-none hidden md:block" />
      <div className="absolute top-1/4 left-[-100px] w-48 h-48 rounded-full bg-white/5 pointer-events-none hidden md:block" />

      {/* Logo + tagline */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center pt-8">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl flex items-center justify-center shadow-lg">
          <span className="text-primary text-4xl md:text-5xl font-display font-extrabold">A</span>
        </div>
        <div>
          <h1 className="text-white text-4xl md:text-6xl font-display font-extrabold tracking-tight">Aero</h1>
          <p className="text-blue-200 text-base md:text-xl font-body mt-2">Pide · Paga · Recoge</p>
          <p className="text-blue-300 text-sm md:text-base font-body mt-3 max-w-xs md:max-w-sm">
            Tu comida favorita del campus, lista cuando la necesites
          </p>
        </div>
      </div>

      {/* Auth buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-8">
        <Link
          href="/login"
          className="w-full bg-white text-primary rounded-button py-4 text-center text-base font-display font-bold shadow-lg active:scale-[0.98] transition-transform"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="w-full border-2 border-white/40 text-white rounded-button py-4 text-center text-base font-display font-semibold active:scale-[0.98] transition-transform"
        >
          Crear cuenta
        </Link>
        <p className="text-center text-blue-300 text-xs font-body mt-2">
          Universidad de La Sabana · Capstone 2026-1
        </p>
      </div>
    </main>
  )
}
