/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Minus, TrendingUp, TrendingDown, Lock,
  Unlock, ChevronDown, ArrowLeft, Clock, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

type Caja = { id: string; nombre: string; descripcion: string | null }
type Movimiento = {
  id: string
  tipo: 'ENTRADA' | 'SALIDA'
  origen: string
  concepto: string
  monto: number
  fecha: string
}
type AperturaActiva = {
  id: string
  saldoInicial: number
  fechaApertura: string
  caja: { nombre: string }
  usuarioApertura: { nombre: string }
  movimientos: Movimiento[]
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFechaHora(f: string) {
  return new Date(f).toLocaleString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const ORIGEN_LABEL: Record<string, string> = {
  MANUAL:      'Manual',
  COBRO_VENTA: 'Cobro venta',
  PAGO_COMPRA: 'Pago compra',
}

export default function CajaPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [cajas, setCajas]               = useState<Caja[]>([])
  const [apertura, setApertura]         = useState<AperturaActiva | null>(null)
  const [saldoActual, setSaldoActual]   = useState(0)
  const [entradas, setEntradas]         = useState(0)
  const [salidas, setSalidas]           = useState(0)
  const [loading, setLoading]           = useState(true)

  // Modales
  const [showApertura, setShowApertura] = useState(false)
  const [showCierre, setShowCierre]     = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')

  // Forms
  const [formApertura, setFormApertura] = useState({ cajaId: '', saldoInicial: '' })
  const [formCierre, setFormCierre]     = useState({ saldoReal: '', observacion: '' })
  const [formMovimiento, setFormMovimiento] = useState({ concepto: '', monto: '' })

  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const [cajasRes, aperturaRes] = await Promise.all([
      fetch('/api/caja'),
      fetch('/api/caja/apertura'),
    ])
    const cajasData    = await cajasRes.json()
    const aperturaData = await aperturaRes.json()

    setCajas(cajasData)
    if (aperturaData.apertura) {
      setApertura(aperturaData.apertura)
      setSaldoActual(aperturaData.saldoActual)
      setEntradas(aperturaData.entradas)
      setSalidas(aperturaData.salidas)
    } else {
      setApertura(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function abrirCaja() {
    if (!formApertura.cajaId) { setError('Seleccioná una caja'); return }
    setGuardando(true); setError('')
    const res = await fetch('/api/caja/apertura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formApertura),
    })
    if (res.ok) {
      setShowApertura(false)
      setFormApertura({ cajaId: '', saldoInicial: '' })
      cargar()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al abrir caja')
    }
    setGuardando(false)
  }

  async function cerrarCaja() {
    if (!formCierre.saldoReal) { setError('Ingresá el saldo real contado'); return }
    setGuardando(true); setError('')
    const res = await fetch('/api/caja/apertura/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCierre),
    })
    if (res.ok) {
      setShowCierre(false)
      setFormCierre({ saldoReal: '', observacion: '' })
      cargar()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al cerrar caja')
    }
    setGuardando(false)
  }

  async function registrarMovimiento() {
    if (!formMovimiento.concepto) { setError('Ingresá un concepto'); return }
    if (!formMovimiento.monto)    { setError('Ingresá el monto'); return }
    setGuardando(true); setError('')
    const res = await fetch('/api/caja/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formMovimiento, tipo: tipoMovimiento }),
    })
    if (res.ok) {
      setShowMovimiento(false)
      setFormMovimiento({ concepto: '', monto: '' })
      cargar()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al registrar movimiento')
    }
    setGuardando(false)
  }

  async function eliminarMovimiento(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await fetch(`/api/caja/movimientos/${id}`, { method: 'DELETE' })
    cargar()
  }

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {apertura ? `Caja abierta — ${apertura.caja.nombre}` : 'No hay caja abierta'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {apertura ? (
            <>
              <button
                onClick={() => { setTipoMovimiento('SALIDA'); setShowMovimiento(true); setError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Minus className="w-4 h-4" /> Egreso
              </button>
              <button
                onClick={() => { setTipoMovimiento('ENTRADA'); setShowMovimiento(true); setError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-green-200 text-green-600 hover:bg-green-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Ingreso
              </button>
              <button
                onClick={() => { setShowCierre(true); setError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: '#dc2626' }}
              >
                <Lock className="w-4 h-4" /> Cerrar caja
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowApertura(true); setError('') }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colorPrimario }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
            >
              <Unlock className="w-4 h-4" /> Abrir caja
            </button>
          )}
          <Link href="/caja/historial"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <Clock className="w-4 h-4" /> Historial
          </Link>
        </div>
      </div>

      {!apertura ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No hay caja abierta</p>
          <p className="text-gray-400 text-sm mb-6">Abrí la caja para registrar movimientos del día</p>
          {cajas.length === 0 ? (
            <div>
              <p className="text-xs text-orange-600 mb-3">⚠️ Primero debés crear una caja en Parámetros</p>
              <Link href="/miscelaneos/cajas"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: colorPrimario }}>
                Ir a Parámetros
              </Link>
            </div>
          ) : (
            <button
              onClick={() => { setShowApertura(true); setError('') }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colorPrimario }}>
              <Unlock className="w-4 h-4" /> Abrir caja ahora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-1">Saldo actual</p>
              <p className="text-2xl font-bold text-gray-900">Gs. {formatGs(saldoActual)}</p>
              <p className="text-xs text-gray-400 mt-1">Saldo inicial: Gs. {formatGs(apertura.saldoInicial)}</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-1">Total ingresos</p>
              <p className="text-2xl font-bold text-green-600">Gs. {formatGs(entradas)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {apertura.movimientos.filter(m => m.tipo === 'ENTRADA').length} movimiento{apertura.movimientos.filter(m => m.tipo === 'ENTRADA').length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-1">Total egresos</p>
              <p className="text-2xl font-bold text-red-600">Gs. {formatGs(salidas)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {apertura.movimientos.filter(m => m.tipo === 'SALIDA').length} movimiento{apertura.movimientos.filter(m => m.tipo === 'SALIDA').length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs text-gray-500 mb-1">Apertura</p>
              <p className="text-sm font-semibold text-gray-900">{formatFechaHora(apertura.fechaApertura)}</p>
              <p className="text-xs text-gray-400 mt-1">{apertura.usuarioApertura.nombre}</p>
            </div>
          </div>

          {/* Movimientos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Movimientos de hoy ({apertura.movimientos.length})
              </h2>
            </div>

            {apertura.movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <p className="text-sm">Sin movimientos aún</p>
                <p className="text-xs mt-1">Registrá un ingreso o egreso</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Hora</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Concepto</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Origen</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Ingreso</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Egreso</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {apertura.movimientos.map((m, i) => (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(m.fecha).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.concepto}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {ORIGEN_LABEL[m.origen] || m.origen}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        {m.tipo === 'ENTRADA' ? (
                          <span className="text-green-600">+ Gs. {formatGs(m.monto)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-right">
                        {m.tipo === 'SALIDA' ? (
                          <span className="text-red-600">- Gs. {formatGs(m.monto)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {m.origen === 'MANUAL' && (
                          <button onClick={() => eliminarMovimiento(m.id)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors">
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-xs font-semibold text-gray-600">TOTALES</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                      + Gs. {formatGs(entradas)}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-red-600 text-right">
                      - Gs. {formatGs(salidas)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL APERTURA ── */}
      {showApertura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowApertura(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Abrir caja</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Caja *</label>
                <div className="relative">
                  <select value={formApertura.cajaId}
                    onChange={e => setFormApertura({ ...formApertura, cajaId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                    <option value="">Seleccioná una caja</option>
                    {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Saldo inicial (efectivo en mano)</label>
                <input type="number" min="0" value={formApertura.saldoInicial}
                  onChange={e => setFormApertura({ ...formApertura, saldoInicial: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowApertura(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={abrirCaja} disabled={guardando}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colorPrimario }}>
                {guardando ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CIERRE ── */}
      {showCierre && apertura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCierre(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Cerrar caja</h2>
            <p className="text-gray-500 text-sm mb-5">Resumen del día antes de cerrar</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo inicial</span>
                <span className="font-medium">Gs. {formatGs(apertura.saldoInicial)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">+ Ingresos</span>
                <span className="font-medium text-green-600">Gs. {formatGs(entradas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">- Egresos</span>
                <span className="font-medium text-red-600">Gs. {formatGs(salidas)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Saldo esperado</span>
                <span>Gs. {formatGs(saldoActual)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Saldo real contado *
                </label>
                <input type="number" min="0" value={formCierre.saldoReal}
                  onChange={e => setFormCierre({ ...formCierre, saldoReal: e.target.value })}
                  placeholder="0" autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
                {formCierre.saldoReal && (
                  <p className={`text-xs mt-1 font-medium ${
                    parseFloat(formCierre.saldoReal) === saldoActual ? 'text-green-600' :
                    parseFloat(formCierre.saldoReal) > saldoActual  ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {parseFloat(formCierre.saldoReal) === saldoActual ? '✓ Sin diferencia' :
                     parseFloat(formCierre.saldoReal) > saldoActual
                       ? `Sobrante: Gs. ${formatGs(parseFloat(formCierre.saldoReal) - saldoActual)}`
                       : `Faltante: Gs. ${formatGs(saldoActual - parseFloat(formCierre.saldoReal))}`
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observación</label>
                <textarea value={formCierre.observacion}
                  onChange={e => setFormCierre({ ...formCierre, observacion: e.target.value })}
                  placeholder="Observaciones del cierre..." rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCierre(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={cerrarCaja} disabled={guardando}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                {guardando ? 'Cerrando...' : 'Cerrar caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MOVIMIENTO ── */}
      {showMovimiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMovimiento(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {tipoMovimiento === 'ENTRADA' ? '+ Registrar ingreso' : '- Registrar egreso'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Concepto *</label>
                <input value={formMovimiento.concepto} autoFocus
                  onChange={e => setFormMovimiento({ ...formMovimiento, concepto: e.target.value })}
                  placeholder={tipoMovimiento === 'ENTRADA' ? 'Ej: Venta en efectivo' : 'Ej: Pago de servicio'}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
                <input type="number" min="0" value={formMovimiento.monto}
                  onChange={e => setFormMovimiento({ ...formMovimiento, monto: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMovimiento(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={registrarMovimiento} disabled={guardando}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                  tipoMovimiento === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {guardando ? 'Guardando...' : tipoMovimiento === 'ENTRADA' ? 'Registrar ingreso' : 'Registrar egreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}