/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingCart, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type DashboardData = {
  comprasMes:    { total: number; count: number }
  ventasMes:     { total: number; count: number }
  porPagar:      { total: number; count: number }
  porCobrar:     { total: number; count: number }
  stockBajo:     number
  ultimasCompras: { id: string; nroComprobante: string | null; fecha: string; total: number; proveedor: { nombre: string } }[]
  ultimasVentas:  { id: string; nroComprobante: string | null; fecha: string; total: number; cliente:   { nombre: string } }[]
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function mesActual() {
  return new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'
  const empresaNombre   = user?.empresaNombre   || 'Mi Empresa'

  const [data, setData]     = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { setData(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  if (!data) return null

  const gananciasMes = data.ventasMes.total - data.comprasMes.total

  return (
    <div>
      {/* Bienvenida */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{mesActual()}</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Ventas del mes</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colorPrimario}15` }}>
              <TrendingUp className="w-4 h-4" style={{ color: colorPrimario }} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(data.ventasMes.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.ventasMes.count} factura{data.ventasMes.count !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Compras del mes</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colorPrimario}15` }}>
              <ShoppingCart className="w-4 h-4" style={{ color: colorPrimario }} />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(data.comprasMes.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.comprasMes.count} factura{data.comprasMes.count !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Resultado del mes</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gananciasMes >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <TrendingUp className={`w-4 h-4 ${gananciasMes >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <p className={`text-xl font-bold ${gananciasMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Gs. {formatGs(Math.abs(gananciasMes))}
          </p>
          <p className="text-xs text-gray-400 mt-1">{gananciasMes >= 0 ? 'Ganancia' : 'Pérdida'}</p>
        </div>

        <div className={`rounded-xl border shadow-sm p-5 ${data.stockBajo > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-medium ${data.stockBajo > 0 ? 'text-red-600' : 'text-gray-500'}`}>Stock bajo</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.stockBajo > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-4 h-4 ${data.stockBajo > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className={`text-xl font-bold ${data.stockBajo > 0 ? 'text-red-600' : 'text-gray-900'}`}>{data.stockBajo}</p>
          <p className={`text-xs mt-1 ${data.stockBajo > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            artículo{data.stockBajo !== 1 ? 's' : ''} por debajo del mínimo
          </p>
        </div>

      </div>

      {/* Cuentas por pagar / cobrar */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700">Cuentas por pagar</p>
            <Link href="/compras" className="text-xs flex items-center gap-1 hover:underline" style={{ color: colorPrimario }}>
              Ver compras <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">Gs. {formatGs(data.porPagar.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.porPagar.count} factura{data.porPagar.count !== 1 ? 's' : ''} pendiente{data.porPagar.count !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700">Cuentas por cobrar</p>
            <Link href="/ventas" className="text-xs flex items-center gap-1 hover:underline" style={{ color: colorPrimario }}>
              Ver ventas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">Gs. {formatGs(data.porCobrar.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.porCobrar.count} factura{data.porCobrar.count !== 1 ? 's' : ''} pendiente{data.porCobrar.count !== 1 ? 's' : ''}</p>
        </div>

      </div>

      {/* Últimas operaciones */}
      <div className="grid grid-cols-2 gap-4">

        {/* Últimas compras */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Últimas compras</h2>
            <Link href="/compras" className="text-xs flex items-center gap-1 hover:underline" style={{ color: colorPrimario }}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.ultimasCompras.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Sin registros</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.ultimasCompras.map(c => (
                <Link key={c.id} href={`/compras/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.proveedor.nombre}</p>
                    <p className="text-xs text-gray-400">{c.nroComprobante || '—'} · {formatFecha(c.fecha)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Gs. {formatGs(c.total)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Últimas ventas</h2>
            <Link href="/ventas" className="text-xs flex items-center gap-1 hover:underline" style={{ color: colorPrimario }}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.ultimasVentas.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">Sin registros</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.ultimasVentas.map(v => (
                <Link key={v.id} href={`/ventas/${v.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.cliente.nombre}</p>
                    <p className="text-xs text-gray-400">{v.nroComprobante || '—'} · {formatFecha(v.fecha)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Gs. {formatGs(v.total)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}