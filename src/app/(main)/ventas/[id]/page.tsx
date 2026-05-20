/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Ban, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type VentaDetalle = {
  id: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  total: number
  articulo: { nombre: string; codigo: string | null; unidadMedida: string }
  impuesto: { nombre: string; porcentaje: number } | null
}

type Venta = {
  id: string
  nroComprobante: string | null
  tipoComprobante: string
  fecha: string
  fechaVencimiento: string | null
  tipoCambio: number
  subtotal: number
  descuento: number
  totalIva5: number
  totalIva10: number
  total: number
  estadoPago: string
  montoPagado: number
  estado: string
  observacion: string | null
  cliente: { nombre: string; ruc: string | null; telefono: string | null; email: string | null }
  condicionPago: { nombre: string; dias: number } | null
  moneda: { codigo: string; simbolo: string; nombre: string } | null
  detalles: VentaDetalle[]
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const ESTADO_PAGO_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-orange-50 text-orange-700 border-orange-200',
  PARCIAL:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  PAGADO:    'bg-green-50 text-green-700 border-green-200',
}

const ESTADO_DOC_STYLE: Record<string, string> = {
  BORRADOR:   'bg-gray-100 text-gray-600 border-gray-200',
  CONFIRMADA: 'bg-blue-50 text-blue-700 border-blue-200',
  ANULADA:    'bg-red-50 text-red-600 border-red-200',
}

export default function DetalleVentaPage() {
  const { data: session } = useSession()
  const params  = useParams()
  const router  = useRouter()
  const user    = session?.user as any
  const colorPrimario = user?.colorPrimario || '#1E3A5F'

  const [venta, setVenta]       = useState<Venta | null>(null)
  const [loading, setLoading]   = useState(true)
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    fetch(`/api/ventas/${params.id}`)
      .then(r => r.json())
      .then(data => { setVenta(data); setLoading(false) })
  }, [params.id])

  async function anular() {
    if (!confirm('¿Anular esta venta?')) return
    setAnulando(true)
    await fetch(`/api/ventas/${params.id}`, { method: 'DELETE' })
    router.push('/ventas')
  }

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Cargando...</div>
  if (!venta)  return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Venta no encontrada</div>

  const simbolo = venta.moneda?.simbolo || 'Gs.'

  return (
    <div className="max-w-4xl mx-auto">

      <div className="flex items-center gap-4 mb-6">
        <Link href="/ventas" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{venta.nroComprobante || 'Sin número'}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_DOC_STYLE[venta.estado]}`}>
              {venta.estado}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_PAGO_STYLE[venta.estadoPago]}`}>
              {venta.estadoPago}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{venta.tipoComprobante} · {formatFecha(venta.fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {venta.estado !== 'ANULADA' && (
            <button onClick={anular} disabled={anulando}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
              <Ban className="w-4 h-4" /> Anular
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* INFO CABECERA */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">CLIENTE</p>
              <p className="text-sm font-semibold text-gray-900">{venta.cliente.nombre}</p>
              {venta.cliente.ruc      && <p className="text-xs text-gray-500 mt-0.5">RUC: {venta.cliente.ruc}</p>}
              {venta.cliente.telefono && <p className="text-xs text-gray-500">{venta.cliente.telefono}</p>}
              {venta.cliente.email    && <p className="text-xs text-gray-500">{venta.cliente.email}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">COMPROBANTE</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tipo</span>
                  <span className="text-gray-900 font-medium">{venta.tipoComprobante}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Número</span>
                  <span className="text-gray-900 font-medium font-mono">{venta.nroComprobante || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Fecha</span>
                  <span className="text-gray-900 font-medium">{formatFecha(venta.fecha)}</span>
                </div>
                {venta.fechaVencimiento && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Vencimiento</span>
                    <span className="text-gray-900 font-medium">{formatFecha(venta.fechaVencimiento)}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">COBRO</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Condición</span>
                  <span className="text-gray-900 font-medium">{venta.condicionPago?.nombre || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Moneda</span>
                  <span className="text-gray-900 font-medium">{venta.moneda ? `${venta.moneda.codigo} — ${venta.moneda.nombre}` : '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cobrado</span>
                  <span className="text-gray-900 font-medium">{simbolo} {formatGs(venta.montoPagado)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Saldo</span>
                  <span className={`font-medium ${venta.total - venta.montoPagado > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {simbolo} {formatGs(venta.total - venta.montoPagado)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {venta.observacion && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">OBSERVACIÓN</p>
              <p className="text-sm text-gray-700">{venta.observacion}</p>
            </div>
          )}
        </div>

        {/* ÍTEMS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Ítems</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Artículo</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Cantidad</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Precio unit.</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Desc. %</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Impuesto</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.detalles.map((d, i) => (
                <tr key={d.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{d.articulo.nombre}</p>
                    <p className="text-xs text-gray-400">{d.articulo.codigo} · {d.articulo.unidadMedida}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatGs(d.cantidad)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{simbolo} {formatGs(d.precioUnitario)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{d.descuento > 0 ? `${d.descuento}%` : '—'}</td>
                  <td className="px-4 py-3">
                    {d.impuesto ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {d.impuesto.nombre}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                    {simbolo} {formatGs(d.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{simbolo} {formatGs(venta.subtotal)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Descuento</span>
                  <span className="text-red-500">- {simbolo} {formatGs(venta.descuento)}</span>
                </div>
              )}
              {venta.totalIva5 > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA 5%</span><span>Gs. {formatGs(venta.totalIva5)}</span>
                </div>
              )}
              {venta.totalIva10 > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA 10%</span><span>Gs. {formatGs(venta.totalIva10)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>{simbolo} {formatGs(venta.total)}</span>
              </div>
              {venta.estadoPago !== 'PAGADO' && (
                <div className="flex justify-between text-sm font-medium text-orange-600 pt-1">
                  <span>Saldo pendiente</span>
                  <span>{simbolo} {formatGs(venta.total - venta.montoPagado)}</span>
                </div>
              )}
              {venta.estadoPago === 'PAGADO' && (
                <div className="flex items-center justify-center gap-2 mt-2 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Cobrado
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}