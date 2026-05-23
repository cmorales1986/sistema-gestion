/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Package, AlertTriangle, ChevronDown } from 'lucide-react'
import Loading from '@/components/loading'

type Almacen = { id: string; nombre: string }
type StockItem = {
  id: string
  cantidad: number
  articulo: {
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockMinimo: number
    precioCompra: number | null
    precioVenta: number | null
    categoria: { nombre: string } | null
  }
  almacen: { id: string; nombre: string }
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }

export default function StockPage() {
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [stock, setStock]         = useState<StockItem[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [busqueda, setBusqueda]   = useState('')
  const [almacenId, setAlmacenId] = useState('')
  const [loading, setLoading]     = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busqueda)  params.set('q', busqueda)
    if (almacenId) params.set('almacenId', almacenId)
    const res = await fetch(`/api/stock?${params}`)
    setStock(await res.json())
    setLoading(false)
  }, [busqueda, almacenId])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    fetch('/api/almacenes').then(r => r.json()).then(setAlmacenes)
  }, [])

  const stockBajo    = stock.filter(s => s.cantidad <= s.articulo.stockMinimo && s.articulo.stockMinimo > 0)
  const valorTotal   = stock.reduce((a, s) => a + (s.cantidad * (s.articulo.precioCompra || 0)), 0)
  const totalUnidades = stock.reduce((a, s) => a + s.cantidad, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-500 text-sm mt-0.5">{stock.length} artículo{stock.length !== 1 ? 's' : ''} en inventario</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Valor del inventario</p>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(valorTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">a precio de compra promedio</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Artículos con stock bajo</p>
          <p className={`text-xl font-bold ${stockBajo.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {stockBajo.length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">por debajo del mínimo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total unidades</p>
          <p className="text-xl font-bold text-gray-900">{formatGs(totalUnidades)}</p>
          <p className="text-xs text-gray-400 mt-0.5">en todos los almacenes</p>
        </div>
      </div>

      {/* Alertas stock bajo */}
      {stockBajo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-700">Artículos con stock bajo</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                {s.articulo.nombre} — {formatGs(s.cantidad)} {s.articulo.unidadMedida}
                <span className="text-red-400">(mín: {formatGs(s.articulo.stockMinimo)})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>
        <div className="relative w-56">
          <select
            value={almacenId}
            onChange={e => setAlmacenId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando stock..." />
          </div>
        ) : stock.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay stock registrado</p>
            <p className="text-xs mt-1 text-gray-400">El stock se actualiza automáticamente con las compras confirmadas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Código</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Artículo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Categoría</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Almacén</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Stock actual</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Stock mínimo</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Compra</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Venta</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s, i) => {
                const bajo        = s.cantidad <= s.articulo.stockMinimo && s.articulo.stockMinimo > 0
                const valorItem   = s.cantidad * (s.articulo.precioCompra || 0)
                return (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.articulo.codigo || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{s.articulo.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.articulo.categoria?.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {s.almacen.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bajo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                      }`}>
                        {bajo && <AlertTriangle className="w-3 h-3" />}
                        {formatGs(s.cantidad)} {s.articulo.unidadMedida}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                      {formatGs(s.articulo.stockMinimo)} {s.articulo.unidadMedida}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {s.articulo.precioCompra ? `Gs. ${formatGs(s.articulo.precioCompra)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {s.articulo.precioVenta ? `Gs. ${formatGs(s.articulo.precioVenta)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Gs. {formatGs(valorItem)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totales */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTALES</td>
                <td colSpan={4} className="px-4 py-3" />
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  Gs. {formatGs(valorTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}