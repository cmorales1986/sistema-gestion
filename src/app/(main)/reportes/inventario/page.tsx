/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/loading'

type StockItem = {
  id: string
  cantidad: number
  articulo: {
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockMinimo: number
    precioCompra: number | null
    precioVenta: number | null
    categoria: { nombre: string } | null
  }
  almacen: { nombre: string }
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }

export default function ReporteInventarioPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario = user?.colorPrimario || '#1E3A5F'

  const [stock, setStock]       = useState<StockItem[]>([])
  const [valorTotal, setValorTotal] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/reportes/inventario')
      .then(r => r.json())
      .then(data => {
        setStock(data.stock)
        setValorTotal(data.valorTotal)
        setLoading(false)
      })
  }, [])

  const stockBajo = stock.filter(s => s.articulo.stockMinimo > 0 && s.cantidad <= s.articulo.stockMinimo)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reportes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Inventario valorizado</h1>
          <p className="text-gray-500 text-sm mt-0.5">{stock.length} artículo{stock.length !== 1 ? 's' : ''} en stock</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Valor del inventario</p>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(valorTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">a precio de compra promedio</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Artículos en stock</p>
          <p className="text-xl font-bold text-gray-900">{stock.length}</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 ${stockBajo.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs mb-1 ${stockBajo.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>Stock bajo</p>
          <p className={`text-xl font-bold ${stockBajo.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stockBajo.length}</p>
          <p className={`text-xs mt-0.5 ${stockBajo.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>por debajo del mínimo</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando inventario..." />
          </div>
        ) : stock.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No hay stock registrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Código</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Artículo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Categoría</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Almacén</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Stock</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Mínimo</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Compra</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Venta</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s, i) => {
                const bajo  = s.articulo.stockMinimo > 0 && s.cantidad <= s.articulo.stockMinimo
                const valor = s.cantidad * (s.articulo.precioCompra || 0)
                return (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${bajo ? 'bg-red-50/20' : i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{s.articulo.codigo || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.articulo.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.articulo.categoria?.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {s.almacen.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bajo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {bajo && <AlertTriangle className="w-3 h-3" />}
                        {formatGs(s.cantidad)} {s.articulo.unidadMedida}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatGs(s.articulo.stockMinimo)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {s.articulo.precioCompra ? `Gs. ${formatGs(s.articulo.precioCompra)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {s.articulo.precioVenta ? `Gs. ${formatGs(s.articulo.precioVenta)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Gs. {formatGs(valor)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={8} className="px-4 py-3 text-xs font-semibold text-gray-600">VALOR TOTAL DEL INVENTARIO</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(valorTotal)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}