/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
// src/app/(main)/bancos/conciliacion/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, Clock, Plus, Trash2,
  TrendingUp, TrendingDown, AlertTriangle, Lock
} from 'lucide-react'
import Link from 'next/link'

type MovimientoBancario = {
  id:            string
  tipo:          'CREDITO' | 'DEBITO'
  concepto:      string
  monto:         number
  fecha:         string
  estado:        'PENDIENTE' | 'CONCILIADO'
  referenciaTipo: string | null
  cheque:        { nroCheque: string; tipo: string } | null
}

type AjusteConciliacion = {
  id:          string
  tipo:        string
  descripcion: string
  monto:       number
  fecha:       string
  creadoPor:   string | null
}

type Conciliacion = {
  id:            string
  periodo:       string
  fechaDesde:    string
  fechaHasta:    string
  saldoExtracto: number
  saldoLibros:   number
  diferencia:    number
  estado:        'BORRADOR' | 'CERRADA'
  cerradaEn:     string | null
  cerradaPor:    string | null
  notas:         string | null
  cuenta: {
    nroCuenta:    string
    saldoInicial: number
    banco:        { nombre: string; codigo: string }
    moneda:       { codigo: string; simbolo: string } | null
  }
  movimientos: MovimientoBancario[]
  ajustes:     AjusteConciliacion[]
}

const TIPOS_AJUSTE = [
  { value: 'NOTA_CREDITO_BANCO',    label: 'Nota de crédito banco',     signo: +1 },
  { value: 'NOTA_DEBITO_BANCO',     label: 'Nota de débito banco',      signo: -1 },
  { value: 'DEPOSITO_EN_TRANSITO',  label: 'Depósito en tránsito',      signo: +1 },
  { value: 'CHEQUE_EN_CIRCULACION', label: 'Cheque en circulación',     signo: -1 },
  { value: 'ERROR_REGISTRO',        label: 'Error de registro',         signo: +1 },
  { value: 'OTRO',                  label: 'Otro ajuste',               signo: +1 },
]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DetalleConciliacionPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [conciliacion, setConciliacion] = useState<Conciliacion | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [cerrando,     setCerrando]     = useState(false)
  const [showAjuste,   setShowAjuste]   = useState(false)
  const [guardandoAjuste, setGuardandoAjuste] = useState(false)
  const [errorAjuste,  setErrorAjuste]  = useState('')

  const hoy = new Date().toISOString().split('T')[0]
  const [formAjuste, setFormAjuste] = useState({
    tipo:        'NOTA_CREDITO_BANCO',
    descripcion: '',
    monto:       '',
    fecha:       hoy,
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/bancos/conciliacion/${params.id}`)
    if (res.ok) setConciliacion(await res.json())
    setLoading(false)
  }, [params.id])

  useEffect(() => { cargar() }, [cargar])

  async function cerrar() {
    if (!confirm('¿Cerrar esta conciliación? Esta acción marcará todos los movimientos como conciliados y no podrá editarse.')) return
    setCerrando(true)
    const res = await fetch(`/api/bancos/conciliacion/${params.id}/cerrar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    })
    if (res.ok) { cargar() }
    setCerrando(false)
  }

  async function agregarAjuste() {
    if (!formAjuste.descripcion) { setErrorAjuste('Ingresá una descripción'); return }
    if (!formAjuste.monto)       { setErrorAjuste('Ingresá el monto'); return }
    setGuardandoAjuste(true); setErrorAjuste('')

    // Aplicar signo según tipo
    const tipoInfo = TIPOS_AJUSTE.find(t => t.value === formAjuste.tipo)
    const montoFinal = parseFloat(formAjuste.monto) * (tipoInfo?.signo || 1)

    const res = await fetch(`/api/bancos/conciliacion/${params.id}/ajustes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...formAjuste, monto: montoFinal }),
    })
    if (res.ok) {
      setShowAjuste(false)
      setFormAjuste({ tipo: 'NOTA_CREDITO_BANCO', descripcion: '', monto: '', fecha: hoy })
      cargar()
    } else {
      const data = await res.json()
      setErrorAjuste(data.error || 'Error al agregar ajuste')
    }
    setGuardandoAjuste(false)
  }

  async function eliminarAjuste(ajusteId: string) {
    if (!confirm('¿Eliminar este ajuste?')) return
    await fetch(`/api/bancos/conciliacion/${params.id}/ajustes?ajusteId=${ajusteId}`, { method: 'DELETE' })
    cargar()
  }

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Cargando...</div>
  if (!conciliacion) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Conciliación no encontrada</div>

  const simbolo = conciliacion.cuenta.moneda?.simbolo || 'Gs.'
  const cerrada = conciliacion.estado === 'CERRADA'
  const totalAjustes = conciliacion.ajustes.reduce((a, aj) => a + aj.monto, 0)
  const diferenciaConAjustes = conciliacion.saldoExtracto - (conciliacion.saldoLibros + totalAjustes)
  const estaConciliado = Math.abs(diferenciaConAjustes) < 1

  const creditos = conciliacion.movimientos.filter(m => m.tipo === 'CREDITO').reduce((a, m) => a + m.monto, 0)
  const debitos  = conciliacion.movimientos.filter(m => m.tipo === 'DEBITO').reduce((a, m) => a + m.monto, 0)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/bancos/conciliacion" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              Conciliación {conciliacion.periodo}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              cerrada ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
            }`}>
              {cerrada ? <><CheckCircle className="w-3 h-3" /> Cerrada</> : <><Clock className="w-3 h-3" /> Borrador</>}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {conciliacion.cuenta.banco.nombre} — {conciliacion.cuenta.nroCuenta} ·{' '}
            {formatFecha(conciliacion.fechaDesde)} al {formatFecha(conciliacion.fechaHasta)}
          </p>
        </div>
        {!cerrada && (
          <button
            onClick={cerrar}
            disabled={cerrando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: estaConciliado ? '#16a34a' : colorPrimario }}
          >
            <Lock className="w-4 h-4" />
            {cerrando ? 'Cerrando...' : 'Cerrar conciliación'}
          </button>
        )}
      </div>

      {/* Advertencia si hay diferencia */}
      {!cerrada && !estaConciliado && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-700">
            Existe una diferencia de <strong>{simbolo} {formatGs(Math.abs(diferenciaConAjustes))}</strong> entre
            el extracto y los libros. Podés agregar ajustes para explicar la diferencia antes de cerrar.
          </p>
        </div>
      )}

      {cerrada && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">
            Conciliación cerrada el {formatFecha(conciliacion.cerradaEn!)} por {conciliacion.cerradaPor}.
            Los movimientos del período están marcados como conciliados.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Resumen de saldos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumen de saldos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Saldo según extracto</p>
              <p className="text-xl font-bold text-gray-900">{simbolo} {formatGs(conciliacion.saldoExtracto)}</p>
              <p className="text-xs text-gray-400 mt-1">Según banco</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Saldo según libros</p>
              <p className="text-xl font-bold text-gray-900">{simbolo} {formatGs(conciliacion.saldoLibros)}</p>
              <p className="text-xs text-gray-400 mt-1">Al {formatFecha(conciliacion.fechaHasta)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total ajustes</p>
              <p className={`text-xl font-bold ${totalAjustes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {totalAjustes >= 0 ? '+' : ''}{simbolo} {formatGs(totalAjustes)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{conciliacion.ajustes.length} ajuste{conciliacion.ajustes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className={`rounded-xl p-4 ${estaConciliado ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Diferencia final</p>
              <p className={`text-xl font-bold ${estaConciliado ? 'text-green-600' : 'text-red-600'}`}>
                {diferenciaConAjustes >= 0 ? '' : '-'}{simbolo} {formatGs(Math.abs(diferenciaConAjustes))}
              </p>
              <p className={`text-xs mt-1 ${estaConciliado ? 'text-green-600' : 'text-red-500'}`}>
                {estaConciliado ? '✓ Conciliado' : 'Hay diferencia'}
              </p>
            </div>
          </div>
        </div>

        {/* Movimientos del período */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Movimientos del período</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {conciliacion.movimientos.length} movimientos ·{' '}
                <span className="text-green-600">+{simbolo} {formatGs(creditos)}</span>{' '}
                <span className="text-red-600">-{simbolo} {formatGs(debitos)}</span>
              </p>
            </div>
          </div>

          {conciliacion.movimientos.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No hay movimientos registrados en este período
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Concepto</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Origen</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Crédito</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Débito</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {conciliacion.movimientos.map((m, i) => (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(m.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {m.concepto}
                        {m.cheque && (
                          <span className="ml-2 text-xs text-gray-400">Cheque #{m.cheque.nroCheque}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {m.referenciaTipo || 'MANUAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        {m.tipo === 'CREDITO'
                          ? <span className="text-green-600 flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" /> {simbolo} {formatGs(m.monto)}
                            </span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        {m.tipo === 'DEBITO'
                          ? <span className="text-red-600 flex items-center justify-end gap-1">
                              <TrendingDown className="w-3 h-3" /> {simbolo} {formatGs(m.monto)}
                            </span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.estado === 'CONCILIADO' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {m.estado === 'CONCILIADO' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {m.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTALES</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                      + {simbolo} {formatGs(creditos)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                      - {simbolo} {formatGs(debitos)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Ajustes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Ajustes de conciliación</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Partidas que explican diferencias entre el extracto y los libros
              </p>
            </div>
            {!cerrada && (
              <button
                onClick={() => setShowAjuste(!showAjuste)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors"
                style={{ backgroundColor: colorPrimario }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar ajuste
              </button>
            )}
          </div>

          {/* Formulario de ajuste */}
          {showAjuste && !cerrada && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de ajuste</label>
                  <select
                    value={formAjuste.tipo}
                    onChange={e => setFormAjuste({ ...formAjuste, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none"
                  >
                    {TIPOS_AJUSTE.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label} ({t.signo > 0 ? 'suma al libro' : 'resta del libro'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Descripción *</label>
                  <input
                    value={formAjuste.descripcion}
                    onChange={e => setFormAjuste({ ...formAjuste, descripcion: e.target.value })}
                    placeholder="Ej: Comisión bancaria no registrada"
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
                  <input
                    type="number"
                    min="0"
                    value={formAjuste.monto}
                    onChange={e => setFormAjuste({ ...formAjuste, monto: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formAjuste.fecha}
                    onChange={e => setFormAjuste({ ...formAjuste, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
              {errorAjuste && (
                <p className="text-red-600 text-xs mt-2">{errorAjuste}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowAjuste(false); setErrorAjuste('') }}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarAjuste}
                  disabled={guardandoAjuste}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: colorPrimario }}
                >
                  {guardandoAjuste ? 'Guardando...' : 'Agregar ajuste'}
                </button>
              </div>
            </div>
          )}

          {conciliacion.ajustes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No hay ajustes. {!cerrada && 'Agregá ajustes para explicar diferencias.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Descripción</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Monto</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Por</th>
                  {!cerrada && <th className="w-8 px-4" />}
                </tr>
              </thead>
              <tbody>
                {conciliacion.ajustes.map((aj, i) => (
                  <tr key={aj.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(aj.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {TIPOS_AJUSTE.find(t => t.value === aj.tipo)?.label || aj.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{aj.descripcion}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      <span className={aj.monto >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {aj.monto >= 0 ? '+' : ''}{simbolo} {formatGs(aj.monto)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{aj.creadoPor || '—'}</td>
                    {!cerrada && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => eliminarAjuste(aj.id)}
                          className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTAL AJUSTES</td>
                  <td className="px-4 py-3 text-sm font-bold text-right">
                    <span className={totalAjustes >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                      {totalAjustes >= 0 ? '+' : ''}{simbolo} {formatGs(totalAjustes)}
                    </span>
                  </td>
                  <td colSpan={cerrada ? 1 : 2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Notas */}
        {conciliacion.notas && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-2">NOTAS</h2>
            <p className="text-sm text-gray-700">{conciliacion.notas}</p>
          </div>
        )}
      </div>
    </div>
  )
}