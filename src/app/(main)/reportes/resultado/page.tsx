/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Printer, Search, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

type ResultadoData = {
  ventas:  { total: number; count: number; iva5: number; iva10: number }
  compras: { total: number; count: number; iva5: number; iva10: number }
  resultado: number
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }

const hoy      = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function ReporteResultadoPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [data, setData]     = useState<ResultadoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ desde: inicioMes, hasta: hoy })

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.desde) params.set('desde', filtros.desde)
    if (filtros.hasta) params.set('hasta', filtros.hasta)
    const res = await fetch(`/api/reportes/resultado?${params}`)
    setData(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  const ganancia = data?.resultado || 0
  const margen   = data && data.ventas.total > 0
    ? ((ganancia / data.ventas.total) * 100).toFixed(1)
    : '0'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reportes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Resultado por período</h1>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" value={filtros.desde}
              onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" value={filtros.hasta}
              onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>
          <div className="flex items-end">
            <button onClick={cargar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colorPrimario }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : data && (
        <div className="space-y-4">

          {/* Resultado principal */}
          <div className={`rounded-xl border-2 p-6 ${ganancia >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ganancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {ganancia >= 0 ? 'Ganancia' : 'Pérdida'} del período
                </p>
                <p className={`text-4xl font-bold mt-1 ${ganancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  Gs. {formatGs(Math.abs(ganancia))}
                </p>
                <p className={`text-sm mt-1 ${ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Margen: {margen}%
                </p>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${ganancia >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {ganancia >= 0
                  ? <TrendingUp className="w-8 h-8 text-green-600" />
                  : <TrendingDown className="w-8 h-8 text-red-600" />
                }
              </div>
            </div>
          </div>

          {/* Comparativo */}
          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 mb-4">VENTAS</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cantidad de facturas</span>
                  <span className="font-medium text-gray-900">{data.ventas.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 5%</span>
                  <span className="font-medium text-gray-900">Gs. {formatGs(data.ventas.iva5)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 10%</span>
                  <span className="font-medium text-gray-900">Gs. {formatGs(data.ventas.iva10)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                  <span className="text-gray-700">Total ventas</span>
                  <span className="text-blue-600">Gs. {formatGs(data.ventas.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 mb-4">COMPRAS</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cantidad de facturas</span>
                  <span className="font-medium text-gray-900">{data.compras.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 5%</span>
                  <span className="font-medium text-gray-900">Gs. {formatGs(data.compras.iva5)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA 10%</span>
                  <span className="font-medium text-gray-900">Gs. {formatGs(data.compras.iva10)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                  <span className="text-gray-700">Total compras</span>
                  <span className="text-purple-600">Gs. {formatGs(data.compras.total)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}