/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Printer, Search } from 'lucide-react'
import Link from 'next/link'

type Cliente = { id: string; nombre: string }
type Venta = {
  id: string
  nroComprobante: string | null
  fecha: string
  total: number
  totalIva5: number
  totalIva10: number
  subtotal: number
  descuento: number
  montoPagado: number
  estadoPago: string
  cliente: { nombre: string }
  condicionPago: { nombre: string } | null
  moneda: { simbolo: string; codigo: string } | null
}

type ReporteData = {
  ventas: Venta[]
  totalGeneral: number
  totalIva5: number
  totalIva10: number
  totalCobrado: number
  totalPendiente: number
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const hoy   = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function ReporteVentasPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [data, setData]         = useState<ReporteData | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading]   = useState(false)
  const [filtros, setFiltros]   = useState({ desde: inicioMes, hasta: hoy, clienteId: '' })

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(setClientes)
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.desde)    params.set('desde',    filtros.desde)
    if (filtros.hasta)    params.set('hasta',    filtros.hasta)
    if (filtros.clienteId) params.set('clienteId', filtros.clienteId)
    const res = await fetch(`/api/reportes/ventas?${params}`)
    setData(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reportes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ventas por período</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.ventas.length || 0} registros encontrados</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-4 gap-3">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
            <select value={filtros.clienteId}
              onChange={e => setFiltros({ ...filtros, clienteId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none">
              <option value="">Todos</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
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

      {/* Totales */}
      {data && (
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Total ventas',    value: data.totalGeneral,  color: 'text-gray-900' },
            { label: 'IVA 5%',          value: data.totalIva5,     color: 'text-gray-700' },
            { label: 'IVA 10%',         value: data.totalIva10,    color: 'text-gray-700' },
            { label: 'Total cobrado',   value: data.totalCobrado,  color: 'text-green-600' },
            { label: 'Total pendiente', value: data.totalPendiente, color: 'text-orange-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-base font-bold ${color}`}>Gs. {formatGs(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : !data || data.ventas.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No hay ventas en el período seleccionado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Comprobante</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Condición</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Subtotal</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">IVA 5%</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">IVA 10%</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cobro</th>
              </tr>
            </thead>
            <tbody>
              {data.ventas.map((v, i) => (
                <tr key={v.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{v.nroComprobante || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatFecha(v.fecha)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.cliente.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{v.condicionPago?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">Gs. {formatGs(v.subtotal)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{v.totalIva5 > 0 ? `Gs. ${formatGs(v.totalIva5)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{v.totalIva10 > 0 ? `Gs. ${formatGs(v.totalIva10)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(v.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.estadoPago === 'PAGADO'   ? 'bg-green-50 text-green-700' :
                      v.estadoPago === 'PARCIAL'  ? 'bg-yellow-50 text-yellow-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {v.estadoPago}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTALES</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(data.ventas.reduce((a, v) => a + v.subtotal, 0))}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(data.totalIva5)}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(data.totalIva10)}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(data.totalGeneral)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}