'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, TrendingUp, ShoppingBag, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type WeeklyReport = {
  id: string
  week_start: string
  week_end: string
  total_orders: number | null
  total_revenue: number | null
  status: 'pending' | 'generated' | 'failed' | null
  generated_at: string | null
  report_data: {
    daily?: Record<string, { orders: number; revenue: number }>
    avg_order_value?: number
  } | null
  top_product_name?: string | null
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

function formatWeek(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const s = new Date(start + 'T12:00:00').toLocaleDateString('es-CO', opts)
  const e = new Date(end + 'T12:00:00').toLocaleDateString('es-CO', opts)
  return `${s} – ${e}`
}

export default function VendorReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<WeeklyReport | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [deliveredCount, setDeliveredCount] = useState<number | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Compute Colombia week bounds for diagnostic
    const COL_OFFSET_MS = 5 * 60 * 60 * 1000
    const col = new Date(Date.now() - COL_OFFSET_MS)
    const dow = col.getUTCDay()
    const monCol = new Date(col)
    monCol.setUTCDate(col.getUTCDate() - ((dow + 6) % 7))
    monCol.setUTCHours(0, 0, 0, 0)
    const sunEndCol = new Date(monCol.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
    const weekStartTs = new Date(monCol.getTime() + COL_OFFSET_MS).toISOString()
    const weekEndTs = new Date(sunEndCol.getTime() + COL_OFFSET_MS).toISOString()

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', user.id)
      .eq('status', 'delivered')
      .gte('created_at', weekStartTs)
      .lte('created_at', weekEndTs)
    setDeliveredCount(count ?? 0)

    const { data: reps } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('vendor_id', user.id)
      .order('week_start', { ascending: false })
      .limit(12)

    if (reps) {
      // Fetch top product names if available
      const topIds = reps
        .map((r: { top_product_id?: string | null }) => r.top_product_id)
        .filter(Boolean) as string[]

      const productNames: Record<string, string> = {}
      if (topIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', topIds)
        if (products) {
          for (const p of products as { id: string; name: string }[]) {
            productNames[p.id] = p.name
          }
        }
      }

      const mapped: WeeklyReport[] = (reps as (WeeklyReport & { top_product_id?: string | null })[]).map(r => ({
        ...r,
        top_product_name: r.top_product_id ? (productNames[r.top_product_id] ?? null) : null,
      }))
      setReports(mapped)
      if (mapped.length > 0) setSelected(mapped[0])
    }
    setLoading(false)
  }

  async function generateReport() {
    setGenerating(true)
    setGenerateError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: fnError } = await supabase.functions.invoke('weekly-report', {
        body: { vendor_id: user.id, week_offset: 0 },
      })

      if (fnError) {
        // Edge Function failed — fallback to API route
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ week_offset: 0 }),
        })
        if (!res.ok) {
          const json = await res.json() as { error: string }
          setGenerateError(json.error ?? 'Error al generar reporte')
          return
        }
      }

      await loadReports()
    } catch {
      setGenerateError('Error al generar reporte. Intenta de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vendor-background">
        <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vendor-background">
      {/* Header */}
      <div className="bg-vendor px-4 pt-12 pb-5">
        <p className="text-orange-200 text-xs font-body uppercase tracking-wide mb-0.5">
          AERO · La Sabana
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-display font-bold">Reportes Semanales</h1>
            <p className="text-orange-200 text-sm font-body mt-0.5">
              {reports.length > 0
                ? `${reports.length} semana${reports.length !== 1 ? 's' : ''} disponible${reports.length !== 1 ? 's' : ''}`
                : 'Aún no hay reportes'}
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-2"
          >
            <RefreshCw
              size={14}
              className={cn('text-white', generating && 'animate-spin')}
            />
            <span className="text-white text-xs font-display font-semibold">
              {generating ? 'Generando…' : 'Generar'}
            </span>
          </button>
        </div>
      </div>

      {generateError && (
        <div className="mx-4 mt-3 p-3 bg-error/10 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
          <p className="text-sm font-body text-error">{generateError}</p>
        </div>
      )}

      {deliveredCount !== null && (
        <div className="mx-4 mt-3 p-3 bg-white rounded-xl shadow-sm flex items-center gap-2">
          <ShoppingBag size={14} className="text-vendor shrink-0" />
          <p className="text-xs font-body text-text-secondary">
            {deliveredCount > 0
              ? `${deliveredCount} pedido${deliveredCount !== 1 ? 's' : ''} entregado${deliveredCount !== 1 ? 's' : ''} esta semana`
              : 'Sin pedidos entregados esta semana — completa la entrega con el código de 4 dígitos para que aparezcan en el reporte'}
          </p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="bg-vendor/10 rounded-full p-5 mb-4">
            <BarChart2 size={40} className="text-vendor" />
          </div>
          <p className="font-display font-bold text-text-primary text-lg">
            Sin reportes aún
          </p>
          <p className="text-text-secondary text-sm font-body mt-1 max-w-xs">
            Genera tu primer reporte para ver las estadísticas de la semana actual
          </p>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Week selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {reports.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={cn(
                  'shrink-0 rounded-xl px-3 py-2 text-xs font-display font-semibold border transition-colors',
                  selected?.id === r.id
                    ? 'bg-vendor text-white border-vendor'
                    : 'bg-white text-text-secondary border-border',
                )}
              >
                {formatWeek(r.week_start, r.week_end)}
              </button>
            ))}
          </div>

          {selected && <ReportDetail report={selected} />}
        </div>
      )}
    </div>
  )
}

function ReportDetail({ report }: { report: WeeklyReport }) {
  if (report.status === 'failed') {
    return (
      <div className="bg-white rounded-card shadow-sm p-4 flex items-center gap-3">
        <AlertCircle size={20} className="text-error shrink-0" />
        <p className="text-sm font-body text-text-secondary">
          No se pudo generar el reporte para esta semana
        </p>
      </div>
    )
  }

  if (report.status === 'pending') {
    return (
      <div className="bg-white rounded-card shadow-sm p-4 text-center py-10">
        <div className="w-6 h-6 border-2 border-vendor border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-body text-text-secondary">Generando reporte…</p>
      </div>
    )
  }

  const dailyEntries = Object.entries(report.report_data?.daily ?? {}).sort(
    ([a], [b]) => a.localeCompare(b),
  )
  const maxRevenue = Math.max(...dailyEntries.map(([, v]) => v.revenue), 1)

  return (
    <div className="flex flex-col gap-3">
      {(report.total_orders === 0 || report.total_orders === null) && (
        <div className="bg-white rounded-card shadow-sm p-4 flex items-start gap-2">
          <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-sm font-body text-text-secondary">
            No hay pedidos entregados esta semana. Para que aparezcan en el reporte, completa la entrega con el código de 4 dígitos.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<ShoppingBag size={18} className="text-vendor" />}
          label="Pedidos"
          value={String(report.total_orders ?? 0)}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-vendor" />}
          label="Ingresos"
          value={fmt(report.total_revenue ?? 0)}
        />
      </div>

      {report.report_data?.avg_order_value != null && (
        <div className="bg-white rounded-card shadow-sm p-4">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
            Valor promedio por pedido
          </p>
          <p className="text-xl font-display font-bold text-text-primary">
            {fmt(report.report_data.avg_order_value)}
          </p>
        </div>
      )}

      {report.top_product_name && (
        <div className="bg-white rounded-card shadow-sm p-4">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
            Producto estrella
          </p>
          <p className="text-base font-display font-bold text-text-primary">
            {report.top_product_name}
          </p>
        </div>
      )}

      {/* Daily bar chart */}
      {dailyEntries.length > 0 && (
        <div className="bg-white rounded-card shadow-sm p-4">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Ingresos por día
          </p>
          <div className="flex items-end gap-1.5 h-24">
            {dailyEntries.map(([date, val]) => {
              const pct = (val.revenue / maxRevenue) * 100
              const label = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'short',
              })
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: 80 }}>
                    <div
                      className="w-full rounded-t-md bg-vendor/70 transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-body text-text-secondary capitalize">
                    {label.replace('.', '')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Daily table */}
      {dailyEntries.length > 0 && (
        <div className="bg-white rounded-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide">
              Detalle por día
            </p>
          </div>
          {dailyEntries.map(([date, val]) => {
            const label = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })
            return (
              <div
                key={date}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-body text-text-primary capitalize">{label}</p>
                  <p className="text-xs font-body text-text-secondary">
                    {val.orders} pedido{val.orders !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="font-display font-bold text-text-primary text-sm">
                  {fmt(val.revenue)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {report.generated_at && (
        <p className="text-center text-xs font-body text-text-disabled pb-2">
          Generado{' '}
          {new Date(report.generated_at).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-card shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-vendor/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-xl font-display font-bold text-text-primary">{value}</p>
    </div>
  )
}
