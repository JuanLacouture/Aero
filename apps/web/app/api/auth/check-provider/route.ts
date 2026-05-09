import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url || !url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  try {
    const res = await fetch(url, { redirect: 'manual' })
    if (res.status === 400) {
      return NextResponse.json(
        { error: 'Este proveedor de autenticación no está habilitado. Por favor usa email y contraseña.' },
        { status: 400 }
      )
    }
    // 302 = provider redirect = OK
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar el proveedor' }, { status: 500 })
  }
}
