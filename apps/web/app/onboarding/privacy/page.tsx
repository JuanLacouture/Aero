'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, ChevronDown, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PrivacyConsentPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState('')

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 40
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
    if (atBottom) setScrolledToEnd(true)
  }, [])

  async function handleAccept() {
    setAccepting(true)
    setError('')
    try {
      const res = await fetch('/api/consent', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Error al guardar el consentimiento')
        setAccepting(false)
        return
      }
      // Force a hard redirect so middleware re-reads the updated profile
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

      window.location.href = profile?.role === 'vendor' ? '/vendor/dashboard' : '/student/home'
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
      setAccepting(false)
    }
  }

  async function handleReject() {
    setRejecting(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login?rejected=true'
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold italic text-primary text-xl leading-none">Aero</p>
          <p className="text-text-secondary text-xs font-body mt-0.5">Protección de Datos Personales</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 gap-5">
        {/* Title block */}
        <div className="text-center px-2">
          <h1 className="text-text-primary text-2xl font-display font-bold leading-snug">
            Política de Protección de<br />Datos Personales
          </h1>
          <p className="text-text-secondary text-sm font-body mt-2 leading-relaxed">
            Antes de continuar, por favor lee y acepta nuestra política de privacidad.
            Desplázate hasta el final para habilitar el botón de aceptación.
          </p>
        </div>

        {/* Scroll hint */}
        {!scrolledToEnd && (
          <div className="flex items-center justify-center gap-1.5 text-text-disabled text-xs font-body animate-bounce">
            <ChevronDown size={14} />
            <span>Desplázate hasta el final</span>
            <ChevronDown size={14} />
          </div>
        )}

        {/* Policy text container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 bg-white border border-border rounded-2xl overflow-y-auto shadow-sm"
          style={{ maxHeight: 'calc(100vh - 340px)', minHeight: '280px' }}
        >
          <div className="px-5 py-5 space-y-5 text-sm font-body text-text-primary leading-relaxed">

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">1. Introducción y Marco Legal</h2>
              <p>
                AERO, plataforma digital de conexión alimentaria desarrollada en el marco del Capstone 2026-1
                de la Universidad de La Sabana (Sabana Centro, Cundinamarca, Colombia), en cumplimiento de la
                <strong> Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales) y su decreto
                reglamentario <strong>Decreto 1377 de 2013</strong>, le informa sobre el tratamiento que se
                dará a sus datos personales.
              </p>
              <p className="mt-2">
                El responsable del tratamiento de los datos es el equipo de desarrollo de AERO —
                Universidad de La Sabana, correo de contacto:{' '}
                <a href="mailto:aero@unisabana.edu.co" className="text-primary font-semibold underline">
                  aero@unisabana.edu.co
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">2. Definiciones</h2>
              <ul className="space-y-1.5 list-none">
                <li><strong>Dato personal:</strong> Cualquier información vinculada o que pueda asociarse a una persona natural determinada o determinable.</li>
                <li><strong>Dato sensible:</strong> Aquel que afecta la intimidad del titular o cuyo uso indebido puede generar discriminación.</li>
                <li><strong>Titular:</strong> La persona natural cuyos datos son objeto de tratamiento.</li>
                <li><strong>Responsable del tratamiento:</strong> La persona o entidad que decide sobre la base de datos y el tratamiento de los datos.</li>
                <li><strong>Tratamiento:</strong> Cualquier operación sobre datos personales (recolección, almacenamiento, uso, circulación, supresión).</li>
                <li><strong>Autorización:</strong> Consentimiento previo, expreso e informado del titular para llevar a cabo el tratamiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">3. Datos Recolectados</h2>
              <p>AERO recopila los siguientes datos para su funcionamiento:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>Nombre completo y correo electrónico (registro y autenticación)</li>
                <li>Número de teléfono (opcional, para notificaciones)</li>
                <li>Fotografía de perfil (proporcionada por el proveedor de autenticación o subida voluntariamente)</li>
                <li>Información de pedidos: productos seleccionados, montos, fecha y hora, punto de entrega</li>
                <li>Información de pagos: método de pago y referencia de transacción (no se almacenan datos de tarjeta)</li>
                <li>Ubicación del punto de entrega seleccionado dentro del campus</li>
                <li>Calificaciones y comentarios sobre vendedores</li>
                <li>Token de notificaciones push (FCM) para alertas de estado de pedido</li>
                <li>Fecha y versión de aceptación de la presente política</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">4. Finalidades del Tratamiento</h2>
              <p>Los datos personales recolectados serán utilizados para:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>Crear y gestionar su cuenta de usuario en la plataforma AERO</li>
                <li>Procesar y hacer seguimiento de los pedidos realizados</li>
                <li>Facilitar el proceso de pago de forma segura</li>
                <li>Enviar notificaciones sobre el estado de sus pedidos</li>
                <li>Permitir la comunicación entre estudiantes y vendedores</li>
                <li>Generar estadísticas y reportes para mejorar el servicio</li>
                <li>Cumplir con obligaciones legales y regulatorias aplicables</li>
                <li>Garantizar la seguridad e integridad de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">5. Principios Rectores</h2>
              <p>El tratamiento de sus datos se rige por los siguientes principios establecidos en la Ley 1581 de 2012:</p>
              <ul className="mt-2 space-y-1.5 list-none">
                <li><strong>Legalidad:</strong> El tratamiento es una actividad reglada sujeta a la ley vigente.</li>
                <li><strong>Finalidad:</strong> Los datos se tratan con una finalidad legítima, específica e informada.</li>
                <li><strong>Libertad:</strong> El tratamiento solo puede realizarse con el consentimiento libre del titular.</li>
                <li><strong>Veracidad:</strong> Los datos deben ser veraces, completos y exactos.</li>
                <li><strong>Transparencia:</strong> El titular puede conocer en cualquier momento la información sobre sus datos.</li>
                <li><strong>Seguridad:</strong> Se adoptan medidas técnicas y administrativas para proteger los datos.</li>
                <li><strong>Confidencialidad:</strong> Quienes intervengan en el tratamiento están obligados a guardar reserva.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">6. Derechos del Titular</h2>
              <p>Como titular de sus datos personales, usted tiene derecho a:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>Conocer, actualizar y rectificar sus datos personales</li>
                <li>Solicitar prueba de la autorización otorgada</li>
                <li>Ser informado sobre el uso dado a sus datos</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)</li>
                <li>Revocar la autorización y/o solicitar la supresión de sus datos cuando no se respeten los principios legales</li>
                <li>Acceder gratuitamente a sus datos que hayan sido objeto de tratamiento</li>
              </ul>
              <p className="mt-2">
                Para ejercer estos derechos, contáctenos en{' '}
                <a href="mailto:aero@unisabana.edu.co" className="text-primary font-semibold underline">
                  aero@unisabana.edu.co
                </a>
                . Responderemos dentro de los términos establecidos en la ley.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">7. Seguridad de la Información</h2>
              <p>
                AERO implementa medidas técnicas y organizativas para proteger sus datos personales contra
                acceso no autorizado, divulgación, alteración o destrucción. Estas medidas incluyen:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
                <li>Autenticación segura mediante Supabase Auth con soporte OAuth 2.0</li>
                <li>Políticas de seguridad a nivel de fila (Row Level Security) en la base de datos</li>
                <li>Acceso restringido a los datos según el rol del usuario</li>
                <li>Auditoría de accesos y cambios en datos sensibles</li>
              </ul>
              <p className="mt-2">
                No obstante, ningún sistema de transmisión por Internet es 100% seguro. Si detecta alguna
                vulnerabilidad, infórmenos de inmediato.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">8. Transferencia de Datos</h2>
              <p>
                Sus datos pueden ser procesados por terceros que actúan como encargados del tratamiento en
                nombre de AERO, bajo estrictos acuerdos de confidencialidad y únicamente para las
                finalidades descritas:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>Supabase Inc. (infraestructura de base de datos y autenticación — servidores en Suramérica)</li>
                <li>Vercel Inc. (alojamiento de la aplicación web)</li>
                <li>Kushki, Nequi, Daviplata (procesadores de pagos, según el método seleccionado)</li>
                <li>Google LLC (autenticación OAuth, notificaciones push FCM)</li>
                <li>Microsoft Corporation (autenticación OAuth para cuentas @unisabana.edu.co)</li>
              </ul>
              <p className="mt-2">
                No se realizan transferencias internacionales de datos fuera de los marcos descritos.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">9. Conservación y Supresión</h2>
              <p>
                Sus datos personales se conservarán mientras mantenga una cuenta activa en AERO o mientras
                sea necesario para cumplir las finalidades descritas. Al solicitar la eliminación de su cuenta,
                sus datos serán suprimidos de manera segura dentro de los 30 días hábiles siguientes a la
                solicitud, salvo que exista una obligación legal de conservarlos.
              </p>
              <p className="mt-2">
                Los registros de transacciones y pagos pueden conservarse por el tiempo que exijan las
                normas tributarias y contables aplicables en Colombia.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">10. Consultas y Reclamos</h2>
              <p>
                Para consultas, reclamos o el ejercicio de sus derechos como titular de datos personales,
                puede contactarnos a través de:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-text-secondary">
                <li>
                  Correo electrónico:{' '}
                  <a href="mailto:aero@unisabana.edu.co" className="text-primary font-semibold underline">
                    aero@unisabana.edu.co
                  </a>
                </li>
                <li>Universidad de La Sabana, Campus del Puente del Común, Chía, Cundinamarca</li>
              </ul>
              <p className="mt-2">
                También puede presentar una queja ante la Superintendencia de Industria y Comercio (SIC)
                si considera que sus derechos no han sido atendidos correctamente:{' '}
                <span className="text-text-secondary">www.sic.gov.co</span>
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-base text-text-primary mb-2">11. Vigencia</h2>
              <p>
                La presente política de protección de datos personales rige a partir del <strong>20 de mayo
                de 2026</strong> (versión 1.0) y estará vigente hasta que sea modificada o reemplazada.
                Cualquier cambio sustancial le será notificado con anterioridad a través de la plataforma o
                su correo electrónico registrado, y requerirá una nueva aceptación de su parte.
              </p>
            </section>

            {/* Bottom padding sentinel */}
            <div className="h-4" aria-hidden="true" />
          </div>
        </div>

        {/* Scroll indicator */}
        {scrolledToEnd && (
          <div className="flex items-center gap-2 text-accent text-sm font-display font-semibold justify-center">
            <CheckCircle2 size={16} className="text-accent" />
            <span>Has leído la política completa</span>
          </div>
        )}

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
            <p className="text-error text-sm font-body">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pb-6">
          <button
            onClick={handleAccept}
            disabled={!scrolledToEnd || accepting || rejecting}
            className={cn(
              'w-full py-4 rounded-button font-display font-bold text-base shadow-lg transition-all',
              scrolledToEnd
                ? 'bg-primary text-white active:scale-[0.98] hover:bg-primary-dark'
                : 'bg-border text-text-disabled cursor-not-allowed'
            )}
          >
            {accepting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                Acepto y continuar
              </span>
            )}
          </button>

          <button
            onClick={handleReject}
            disabled={accepting || rejecting}
            className="w-full py-3.5 rounded-button font-display font-semibold text-sm text-text-secondary border border-border bg-white hover:bg-background active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {rejecting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                Cerrando sesión...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <XCircle size={16} />
                Rechazar y salir
              </span>
            )}
          </button>

          <p className="text-center text-text-disabled text-xs font-body px-4 leading-relaxed">
            Al rechazar, tu sesión será cerrada y no podrás acceder a AERO hasta aceptar la política.
          </p>
        </div>
      </main>
    </div>
  )
}
