/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

type AperturaHistorial = {
  id: string
  fechaApertura: string
  fechaCierre: string
  saldoInicial: number
  saldoFinal: number
  saldoReal: number
  diferencia: number
  observacionCierre: string | null
  caja: { nombre: string }
  usuarioApertura: { nombre: string }
  usuarioCierre: { nombre: string } | null
  movimientos: { tipo: string; monto: number }[]
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFechaHora(f: string) {
  return new Date(f).toLocaleString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function HistorialCajaPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [aperturas, setAperturas]   = useState<AperturaHistorial[]>([])
  const [loading, setLoading]       = useState(false)
  const [filtros, setFiltros]       = useState({ desde: inicioMes, hasta: hoy })
  const [expandido, setExpandido]   = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.desde) params.set('desde', filtros.desde)
    if (filtros.hasta) params.set('hasta', filtros.hasta)
    const res = await fetch(`/api/caja/historial?${params}`)
    setAperturas(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/caja" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Historial de caja</h1>
          <p className="text-gray-500 text-sm mt-0.5">{aperturas.length} cierre{aperturas.length !== 1 ? 's' : ''} encontrado{aperturas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
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
          <div className="flex items-end">
            <button onClick={cargar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: colorPrimario }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : aperturas.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          No hay cierres de caja en el período
        </div>
      ) : (
        <div className="space-y-3">
          {aperturas.map(a => {
            const entradas  = a.movimientos.filter(m => m.tipo === 'ENTRADA').reduce((s, m) => s + m.monto, 0)
            const salidas   = a.movimientos.filter(m => m.tipo === 'SALIDA').reduce((s, m) => s + m.monto, 0)
            const isExpanded = expandido === a.id

            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandido(isExpanded ? null : a.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{a.caja.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFechaHora(a.fechaApertura)} → {formatFechaHora(a.fechaCierre)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Ingresos</p>
                      <p className="text-sm font-medium text-green-600">+ Gs. {formatGs(entradas)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Egresos</p>
                      <p className="text-sm font-medium text-red-600">- Gs. {formatGs(salidas)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Saldo final</p>
                      <p className="text-sm font-bold text-gray-900">Gs. {formatGs(a.saldoReal)}</p>
                    </div>
                    {a.diferencia !== 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Diferencia</p>
                        <p className={`text-sm font-medium ${a.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {a.diferencia > 0 ? '+' : ''} Gs. {formatGs(a.diferencia)}
                        </p>
                      </div>
                    )}
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>↓</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Saldo inicial</p>
                        <p className="font-medium">Gs. {formatGs(a.saldoInicial)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Saldo esperado</p>
                        <p className="font-medium">Gs. {formatGs(a.saldoFinal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Saldo real contado</p>
                        <p className="font-medium">Gs. {formatGs(a.saldoReal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Abrió</p>
                        <p className="font-medium">{a.usuarioApertura.nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cerró</p>
                        <p className="font-medium">{a.usuarioCierre?.nombre || '—'}</p>
                      </div>
                      {a.observacionCierre && (
                        <div>
                          <p className="text-xs text-gray-500">Observación</p>
                          <p className="font-medium">{a.observacionCierre}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}