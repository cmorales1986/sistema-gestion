/* eslint-disable react-hooks/set-state-in-effect */
// src/app/(main)/bancos/conciliacion/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePlan } from '@/lib/use-plan'
import ModuloBloqueado from '@/components/modulo-bloqueado'
import { Plus, ArrowLeft, CheckCircle, Clock, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/loading'

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
    nroCuenta: string
    banco: { nombre: string; codigo: string }
  }
  _count: { movimientos: number; ajustes: number }
}

type CuentaBancaria = {
  id: string
  nroCuenta: string
  banco: { nombre: string }
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ConciliacionPage() {
  const { tieneModulo } = usePlan()
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([])
  const [cuentas,        setCuentas]        = useState<CuentaBancaria[]>([])
  const [cuentaFiltro,   setCuentaFiltro]   = useState('')
  const [loading,        setLoading]        = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (cuentaFiltro) params.set('cuentaId', cuentaFiltro)
    const res = await fetch(`/api/bancos/conciliacion?${params}`)
    setConciliaciones(await res.json())
    setLoading(false)
  }, [cuentaFiltro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => {
    fetch('/api/bancos/cuentas').then(r => r.json()).then(setCuentas)
  }, [])

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta conciliación? Se desvinculan los movimientos asociados.')) return
    await fetch(`/api/bancos/conciliacion/${id}`, { method: 'DELETE' })
    cargar()
  }

  if (!tieneModulo('CONCILIACION')) {
    return (
      <ModuloBloqueado
        modulo="Conciliación Bancaria"
        descripcion="Conciliá tus movimientos bancarios con el extracto del banco. Disponible en el plan Pro."
      />
    )
  }

  const cerradas  = conciliaciones.filter(c => c.estado === 'CERRADA').length
  const borradores = conciliaciones.filter(c => c.estado === 'BORRADOR').length

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/bancos" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Conciliación bancaria</h1>
          <p className="text-gray-500 text-sm mt-0.5">{conciliaciones.length} conciliación{conciliaciones.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link
          href="/bancos/conciliacion/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nueva conciliación
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total conciliaciones</p>
          <p className="text-2xl font-bold text-gray-900">{conciliaciones.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cerradas</p>
          <p className="text-2xl font-bold text-green-600">{cerradas}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">En borrador</p>
          <p className="text-2xl font-bold text-orange-600">{borradores}</p>
        </div>
      </div>

      {/* Filtro por cuenta */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por cuenta</label>
            <select
              value={cuentaFiltro}
              onChange={e => setCuentaFiltro(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none"
            >
              <option value="">Todas las cuentas</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.banco.nombre} — {c.nroCuenta}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <Loading texto="Cargando conciliaciones..." />
        </div>
      ) : conciliaciones.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No hay conciliaciones</p>
          <p className="text-gray-400 text-sm mb-6">Creá tu primera conciliación bancaria</p>
          <Link
            href="/bancos/conciliacion/nueva"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: colorPrimario }}
          >
            <Plus className="w-4 h-4" /> Nueva conciliación
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conciliaciones.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      {c.cuenta.banco.codigo.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {c.cuenta.banco.nombre} — {c.cuenta.nroCuenta}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.estado === 'CERRADA'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}>
                          {c.estado === 'CERRADA'
                            ? <><CheckCircle className="w-3 h-3" /> Cerrada</>
                            : <><Clock className="w-3 h-3" /> Borrador</>
                          }
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Período {c.periodo} · {formatFecha(c.fechaDesde)} al {formatFecha(c.fechaHasta)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c._count.movimientos} movimiento{c._count.movimientos !== 1 ? 's' : ''}
                        {c._count.ajustes > 0 && ` · ${c._count.ajustes} ajuste${c._count.ajustes !== 1 ? 's' : ''}`}
                        {c.cerradaPor && ` · Cerrada por ${c.cerradaPor}`}
                      </p>
                    </div>
                  </div>

                  {/* Saldos */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Saldo extracto</p>
                      <p className="text-sm font-semibold text-gray-900">Gs. {formatGs(c.saldoExtracto)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Saldo libros</p>
                      <p className="text-sm font-semibold text-gray-900">Gs. {formatGs(c.saldoLibros)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Diferencia</p>
                      <p className={`text-sm font-bold ${
                        Math.abs(c.diferencia) < 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {c.diferencia >= 0 ? '' : '-'}Gs. {formatGs(Math.abs(c.diferencia))}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/bancos/conciliacion/${c.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Ver <ArrowRight className="w-3 h-3" />
                      </Link>
                      {c.estado === 'BORRADOR' && (
                        <button
                          onClick={() => eliminar(c.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}