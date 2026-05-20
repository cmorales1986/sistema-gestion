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
  fechaVencimiento: string | null
  total: number
  montoPagado: number
  estadoPago: string
  cliente: { nombre: string; telefono: string | null; email: string | null }
  condicionPago: { nombre: string } | null
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function diasVencimiento(f: string | null) {
  if (!f) return null
  const diff = Math.ceil((new Date(f).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function CuentasCobrarPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [ventas, setVentas]         = useState<Venta[]>([])
  const [total, setTotal]           = useState(0)
  const [clientes, setClientes]     = useState<Cliente[]>([])
  const [loading, setLoading]       = useState(false)
  const [clienteId, setClienteId]   = useState('')

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(setClientes)
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (clienteId) params.set('clienteId', clienteId)
    const res = await fetch(`/api/reportes/cuentas-cobrar?${params}`)
    const data = await res.json()
    setVentas(data.ventas)
    setTotal(data.total)
    setLoading(false)
  }, [clienteId])

  useEffect(() => { cargar() }, [cargar])

  const vencidas = ventas.filter(v => v.fechaVencimiento && new Date(v.fechaVencimiento) < new Date())

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reportes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por cobrar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ventas.length} factura{ventas.length !== 1 ? 's' : ''} pendiente{ventas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total por cobrar</p>
          <p className="text-xl font-bold text-orange-600">Gs. {formatGs(total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Facturas vencidas</p>
          <p className={`text-xl font-bold ${vencidas.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{vencidas.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Clientes con deuda</p>
          <p className="text-xl font-bold text-gray-900">
            {new Set(ventas.map(v => v.cliente.nombre)).size}
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos los clientes</option>
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

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : ventas.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-green-600 text-sm font-medium">
            ✓ No hay cuentas pendientes de cobro
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Comprobante</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vencimiento</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Condición</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Cobrado</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Saldo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => {
                const saldo = v.total - v.montoPagado
                const dias  = diasVencimiento(v.fechaVencimiento)
                const vencida = dias !== null && dias < 0
                return (
                  <tr key={v.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${vencida ? 'bg-red-50/30' : i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{v.nroComprobante || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{v.cliente.nombre}</p>
                      {v.cliente.telefono && <p className="text-xs text-gray-400">{v.cliente.telefono}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatFecha(v.fecha)}</td>
                    <td className="px-4 py-3 text-sm">
                      {v.fechaVencimiento ? (
                        <span className={vencida ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {formatFecha(v.fechaVencimiento)}
                          {dias !== null && (
                            <span className={`ml-1 text-xs ${vencida ? 'text-red-500' : 'text-gray-400'}`}>
                              {vencida ? `(${Math.abs(dias)}d vencida)` : `(${dias}d)`}
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.condicionPago?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">Gs. {formatGs(v.total)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right">Gs. {formatGs(v.montoPagado)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600 text-right">Gs. {formatGs(saldo)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.estadoPago === 'PARCIAL' ? 'bg-yellow-50 text-yellow-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {v.estadoPago}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTAL PENDIENTE</td>
                <td className="px-4 py-3 text-sm font-bold text-orange-600 text-right">Gs. {formatGs(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}