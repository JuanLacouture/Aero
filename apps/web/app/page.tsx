import Link from 'next/link'

export default function SplashPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">AERO</h1>
        <p className="text-text-secondary text-base max-w-xs">
          Plataforma digital de conexión alimentaria — Sabana Centro
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/auth/login"
            className="w-full rounded-button bg-primary py-3 text-center text-base font-semibold text-white"
          >
            Ingresar
          </Link>
          <Link
            href="/auth/register"
            className="w-full rounded-button border border-primary py-3 text-center text-base font-semibold text-primary"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  )
}
