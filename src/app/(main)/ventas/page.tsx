/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Eye, Ban } from 'lucide-react'
import Link from 'next/link'

type Venta = {
  id: string
  nroComprobante: string | null
  tipoComprobante: string
  fecha: string
  total: number
  estadoPago: string
  montoPagado: number
  estado: string
  moneda: string | null
  cliente: { nombre: string }
  condicionPago: { nombre: string } | null
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ESTADO_PAGO_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-orange-50 text-orange-700',
  PARCIAL:   'bg-yellow-50 text-yellow-700',
  PAGADO:    'bg-green-50 text-green-700',
}

const ESTADO_DOC_STYLE: Record<string, string> = {
  BORRADOR:   'bg-gray-100 text-gray-600',
  CONFIRMADA: 'bg-blue-50 text-blue-700',
  ANULADA:    'bg-red-50 text-red-600',
}

export default function VentasPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [ventas, setVentas]     = useState<Venta[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading]   = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/ventas?q=${busqueda}`)
    setVentas(await res.json())
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  async function anular(id: string) {
    if (!confirm('¿Anular esta venta?')) return
    await fetch(`/api/ventas/${id}`, { method: 'DELETE' })
    cargar()
  }

  const totalVentas    = ventas.filter(v => v.estado !== 'ANULADA').reduce((a, v) => a + v.total, 0)
  const totalPendiente = ventas.filter(v => v.estado !== 'ANULADA' && v.estadoPago !== 'PAGADO').reduce((a, v) => a + (v.total - v.montoPagado), 0)
  const cantidadFacturas = ventas.filter(v => v.estado !== 'ANULADA').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ventas.length} registro{ventas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/ventas/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nueva venta
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total ventas</p>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(totalVentas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Pendiente de cobro</p>
          <p className="text-xl font-bold text-orange-600">Gs. {formatGs(totalPendiente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cantidad de facturas</p>
          <p className="text-xl font-bold text-gray-900">{cantidadFacturas}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : ventas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No hay ventas registradas</p>
            <Link href="/ventas/nueva" className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Registrar primera venta
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Comprobante</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Condición</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cobro</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => (
                <tr key={v.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{v.nroComprobante || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatFecha(v.fecha)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.cliente.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{v.condicionPago?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Gs. {formatGs(v.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_PAGO_STYLE[v.estadoPago]}`}>
                      {v.estadoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_DOC_STYLE[v.estado]}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/ventas/${v.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {v.estado !== 'ANULADA' && (
                        <button onClick={() => anular(v.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}