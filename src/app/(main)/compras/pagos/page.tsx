/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Trash2, ChevronDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import { usePlan } from '@/lib/use-plan'
import Loading from '@/components/loading'

type Proveedor = { id: string; nombre: string }
type Compra    = { id: string; nroComprobante: string | null; total: number; montoPagado: number; proveedor: { nombre: string } }
type Pago = {
  id:            string
  fecha:         string
  monto:         number
  medioPago:     string
  nroReferencia: string | null
  observacion:   string | null
  compra: { nroComprobante: string | null; proveedor: { nombre: string } }
}
type CuentaBancaria = {
  id:        string
  nroCuenta: string
  banco:     { nombre: string; codigo: string }
}

const MEDIOS    = ['EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA', 'OTRO']
const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const MEDIO_STYLE: Record<string, string> = {
  EFECTIVO:      'bg-green-50 text-green-700',
  CHEQUE:        'bg-blue-50 text-blue-700',
  TRANSFERENCIA: 'bg-purple-50 text-purple-700',
  TARJETA:       'bg-orange-50 text-orange-700',
  OTRO:          'bg-gray-100 text-gray-600',
}

export default function PagosComprasPage() {
  const { data: session } = useSession()
  const { tieneModulo }   = usePlan()
  const tieneBancos       = tieneModulo('BANCOS')

  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [pagos,             setPagos]             = useState<Pago[]>([])
  const [total,             setTotal]             = useState(0)
  const [proveedores,       setProveedores]       = useState<Proveedor[]>([])
  const [comprasPendientes, setComprasPendientes] = useState<Compra[]>([])
  const [cuentasBancarias,  setCuentasBancarias]  = useState<CuentaBancaria[]>([])
  const [loading,           setLoading]           = useState(true)
  const [drawerOpen,        setDrawerOpen]        = useState(false)
  const [guardando,         setGuardando]         = useState(false)
  const [error,             setError]             = useState('')

  const [filtros, setFiltros] = useState({
    desde:       inicioMes,
    hasta:       hoy,
    proveedorId: '',
    medioPago:   '',
  })

  const [form, setForm] = useState({
    compraId:         '',
    fecha:            hoy,
    monto:            '',
    medioPago:        'EFECTIVO',
    nroReferencia:    '',
    observacion:      '',
    cuentaBancariaId: '',  // solo plan Pro
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.desde)       params.set('desde',       filtros.desde)
    if (filtros.hasta)       params.set('hasta',       filtros.hasta)
    if (filtros.proveedorId) params.set('proveedorId', filtros.proveedorId)
    if (filtros.medioPago)   params.set('medioPago',   filtros.medioPago)
    const res = await fetch(`/api/compras/pagos?${params}`)
    const data = await res.json()
    setPagos(data.pagos)
    setTotal(data.total)
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    fetch('/api/proveedores').then(r => r.json()).then(setProveedores)
    // Solo cargar cuentas si tiene módulo BANCOS (plan Pro)
    if (tieneBancos) {
      fetch('/api/bancos/cuentas').then(r => r.json()).then(setCuentasBancarias)
    }
  }, [tieneBancos])

  async function abrirDrawer() {
    const res = await fetch('/api/compras?q=')
    const data = await res.json()
    const pendientes = data.filter((c: any) =>
      c.estado === 'CONFIRMADA' && c.estadoPago !== 'PAGADO'
    )
    setComprasPendientes(pendientes)
    setForm({
      compraId: '', fecha: hoy, monto: '',
      medioPago: 'EFECTIVO', nroReferencia: '',
      observacion: '', cuentaBancariaId: '',
    })
    setError('')
    setDrawerOpen(true)
  }

  function seleccionarCompra(compraId: string) {
    const compra = comprasPendientes.find(c => c.id === compraId)
    if (compra) {
      const saldo = compra.total - compra.montoPagado
      setForm(prev => ({ ...prev, compraId, monto: String(saldo) }))
    } else {
      setForm(prev => ({ ...prev, compraId, monto: '' }))
    }
  }

  // ¿El pago requiere elegir cuenta bancaria? Solo Pro + CHEQUE/TRANSFERENCIA
  const requiereCuenta = tieneBancos && ['CHEQUE', 'TRANSFERENCIA'].includes(form.medioPago)

  async function guardar() {
    if (!form.compraId) { setError('Seleccioná una factura'); return }
    if (!form.monto)    { setError('Ingresá el monto'); return }
    if (requiereCuenta && !form.cuentaBancariaId) {
      setError('Seleccioná la cuenta bancaria desde donde se realizará el pago')
      return
    }
    setGuardando(true); setError('')

    const res = await fetch('/api/compras/pagos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        // Solo enviar cuentaBancariaId si aplica
        cuentaBancariaId: requiereCuenta ? form.cuentaBancariaId : null,
      }),
    })

    if (res.ok) {
      setDrawerOpen(false)
      cargar()
    } else {
      try {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
      } catch {
        setError('Error al guardar el pago')
      }
    }
    setGuardando(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este pago? Se revertirá el monto en la factura.')) return
    const res = await fetch(`/api/compras/pagos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'No se pudo eliminar el pago')
      return
    }
    cargar()
  }

  const compraSeleccionada = comprasPendientes.find(c => c.id === form.compraId)
  const saldoCompra = compraSeleccionada ? compraSeleccionada.total - compraSeleccionada.montoPagado : 0

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={guardar}
        disabled={guardando}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: colorPrimario }}
      >
        {guardando ? 'Guardando...' : 'Registrar pago'}
      </button>
    </div>
  )

  console.log('PLAN:', (session?.user as any)?.planNombre)
  console.log('MODULOS:', (session?.user as any)?.modulos)
  console.log('tieneBancos:', tieneBancos)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/compras" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Pagos a proveedores</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado{pagos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirDrawer}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Registrar pago
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total pagado en el período</p>
          <p className="text-xl font-bold text-gray-900">Gs. {formatGs(total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cantidad de pagos</p>
          <p className="text-xl font-bold text-gray-900">{pagos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Efectivo</p>
          <p className="text-xl font-bold text-gray-900">
            Gs. {formatGs(pagos.filter(p => p.medioPago === 'EFECTIVO').reduce((a, p) => a + p.monto, 0))}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" value={filtros.desde}
              onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" value={filtros.hasta}
              onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Proveedor</label>
            <select value={filtros.proveedorId}
              onChange={e => setFiltros({ ...filtros, proveedorId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Medio de pago</label>
            <select value={filtros.medioPago}
              onChange={e => setFiltros({ ...filtros, medioPago: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              {MEDIOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={cargar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: colorPrimario }}>
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando pagos..." />
          </div>
        ) : pagos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No hay pagos en el período seleccionado</p>
            <button onClick={abrirDrawer} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Registrar primer pago
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Proveedor</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Factura</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Medio</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Referencia</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Monto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pagos.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatFecha(p.fecha)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.compra.proveedor.nombre}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{p.compra.nroComprobante || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MEDIO_STYLE[p.medioPago]}`}>
                      {p.medioPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.nroReferencia || '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(p.monto)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => eliminar(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTAL</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── DRAWER NUEVO PAGO ── */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Registrar pago" footer={footer}>
        <div className="space-y-4">

          {/* Factura */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Factura de compra *</label>
            <div className="relative">
              <select
                value={form.compraId}
                onChange={e => seleccionarCompra(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none"
              >
                <option value="">Seleccioná una factura</option>
                {comprasPendientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.proveedor.nombre} — {c.nroComprobante || 'Sin nro'} (saldo: Gs. {formatGs(c.total - c.montoPagado)})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {compraSeleccionada && (
              <p className="text-xs mt-1" style={{ color: colorPrimario }}>
                Saldo pendiente: Gs. {formatGs(saldoCompra)}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
            <input type="number" value={form.monto} min="0"
              onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          {/* Medio de pago */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Medio de pago *</label>
            <div className="grid grid-cols-3 gap-2">
              {MEDIOS.map(m => (
                <button key={m} type="button"
                  onClick={() => setForm({ ...form, medioPago: m, cuentaBancariaId: '' })}
                  className="py-2 rounded-lg text-xs font-medium border-2 transition-all"
                  style={form.medioPago === m
                    ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}10`, color: colorPrimario }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Nro referencia */}
          {(form.medioPago === 'CHEQUE' || form.medioPago === 'TRANSFERENCIA') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.medioPago === 'CHEQUE' ? 'Nro. de cheque' : 'Nro. de transferencia'}
              </label>
              <input value={form.nroReferencia}
                onChange={e => setForm({ ...form, nroReferencia: e.target.value })}
                placeholder={form.medioPago === 'CHEQUE' ? '000123' : 'REF-123456'}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          )}

          {/* ── CUENTA BANCARIA — solo plan Pro con módulo BANCOS ── */}
          {requiereCuenta && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.medioPago === 'CHEQUE'
                  ? 'Cuenta bancaria desde donde se emite el cheque *'
                  : 'Cuenta bancaria desde donde se transfiere *'}
              </label>
              {cuentasBancarias.length === 0 ? (
                <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                  <p className="text-orange-600 text-xs">
                    No hay cuentas bancarias configuradas.{' '}
                    <Link href="/bancos/cuentas/nueva" className="font-medium underline">
                      Configurar cuenta
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={form.cuentaBancariaId}
                    onChange={e => setForm({ ...form, cuentaBancariaId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none"
                  >
                    <option value="">Seleccioná una cuenta</option>
                    {cuentasBancarias.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.banco.nombre} — {c.nroCuenta}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                💡 Se creará un movimiento bancario pendiente para conciliar después.
              </p>
            </div>
          )}

          {/* Info efectivo */}
          {form.medioPago === 'EFECTIVO' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-blue-700 text-xs">
                💡 Si hay una caja abierta, este pago se registrará automáticamente como egreso.
              </p>
            </div>
          )}

          {/* Observación */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observación</label>
            <textarea value={form.observacion}
              onChange={e => setForm({ ...form, observacion: e.target.value })}
              placeholder="Observaciones opcionales" rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  )
}