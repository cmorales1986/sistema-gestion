/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/rules-of-hooks */
// src/app/(dashboard)/stock/remisiones/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePlan } from '@/lib/use-plan'
import ModuloBloqueado from '@/components/modulo-bloqueado'
import { Plus, ArrowLeft, Search, Eye, Ban, CheckCircle, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/loading'

type Remision = {
  id:             string
  numero:         string | null
  tipo:           'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA'
  estado:         'BORRADOR' | 'CONFIRMADA' | 'ANULADA'
  fecha:          string
  esFiscal:       boolean
  nroComprobante: string | null
  motivoEntrada:  string | null
  motivoSalida:   string | null
  observacion:    string | null
  almacenOrigen:  { nombre: string } | null
  almacenDestino: { nombre: string } | null
  _count:         { detalles: number }
}

const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const TIPO_CONFIG = {
  ENTRADA:       { label: 'Entrada',       icon: TrendingUp,       color: 'bg-green-50 text-green-700',  border: 'border-green-200' },
  SALIDA:        { label: 'Salida',        icon: TrendingDown,     color: 'bg-red-50 text-red-700',      border: 'border-red-200'   },
  TRANSFERENCIA: { label: 'Transferencia', icon: ArrowLeftRight,   color: 'bg-blue-50 text-blue-700',    border: 'border-blue-200'  },
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR:   'bg-gray-100 text-gray-600',
  CONFIRMADA: 'bg-green-50 text-green-700',
  ANULADA:    'bg-red-50 text-red-500',
}

export default function RemisionesPage() {
  const { tieneModulo } = usePlan()
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [remisiones, setRemisiones] = useState<Remision[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filtros, setFiltros] = useState({
    tipo:   '',
    estado: '',
    desde:  inicioMes,
    hasta:  hoy,
  })

  // Guard plan Pro
  if (!tieneModulo('STOCK_AVANZADO') && !tieneModulo('REMISIONES')) {
    return (
      <ModuloBloqueado
        modulo="Remisiones y movimientos de stock"
        descripcion="Registrá entradas y salidas de mercadería sin factura, transferencias entre almacenes y ajustes de inventario. Disponible en el plan Pro."
      />
    )
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.tipo)   params.set('tipo',   filtros.tipo)
    if (filtros.estado) params.set('estado', filtros.estado)
    if (filtros.desde)  params.set('desde',  filtros.desde)
    if (filtros.hasta)  params.set('hasta',  filtros.hasta)
    const res = await fetch(`/api/remisiones?${params}`)
    setRemisiones(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  async function anular(id: string, numero: string | null) {
    const motivo = prompt(`¿Motivo de anulación de ${numero || 'la remisión'}?`)
    if (motivo === null) return
    const res = await fetch(`/api/remisiones/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ accion: 'ANULAR', motivo }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Error al anular')
      return
    }
    cargar()
  }

  async function confirmar(id: string) {
    if (!confirm('¿Confirmar esta remisión? Esto actualizará el stock.')) return
    const res = await fetch(`/api/remisiones/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ accion: 'CONFIRMAR' }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Error al confirmar')
      return
    }
    cargar()
  }

  const totalEntradas      = remisiones.filter(r => r.tipo === 'ENTRADA'       && r.estado === 'CONFIRMADA').length
  const totalSalidas       = remisiones.filter(r => r.tipo === 'SALIDA'        && r.estado === 'CONFIRMADA').length
  const totalTransferencias = remisiones.filter(r => r.tipo === 'TRANSFERENCIA' && r.estado === 'CONFIRMADA').length

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/stock" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Remisiones y movimientos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Entradas, salidas y transferencias sin factura</p>
        </div>
        <Link
          href="/stock/remisiones/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nueva remisión
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Entradas confirmadas</p>
            <p className="text-xl font-bold text-green-600">{totalEntradas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Salidas confirmadas</p>
            <p className="text-xl font-bold text-red-600">{totalSalidas}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Transferencias confirmadas</p>
            <p className="text-xl font-bold text-blue-600">{totalTransferencias}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              <option value="BORRADOR">Borrador</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none" />
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
            <Loading texto="Cargando remisiones..." />
          </div>
        ) : remisiones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ArrowLeftRight className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No hay remisiones en el período</p>
            <Link href="/stock/remisiones/nueva"
              className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Crear primera remisión
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Número</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Almacenes</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Motivo</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Artículos</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {remisiones.map((r, i) => {
                const tipoConf = TIPO_CONFIG[r.tipo]
                const TipoIcon = tipoConf.icon
                return (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-medium text-gray-900">{r.numero || '—'}</p>
                      {r.esFiscal && r.nroComprobante && (
                        <p className="text-xs text-gray-400">{r.nroComprobante}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoConf.color}`}>
                        <TipoIcon className="w-3 h-3" />
                        {tipoConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(r.fecha)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.tipo === 'ENTRADA'       && r.almacenDestino && `→ ${r.almacenDestino.nombre}`}
                      {r.tipo === 'SALIDA'        && r.almacenOrigen  && `${r.almacenOrigen.nombre} →`}
                      {r.tipo === 'TRANSFERENCIA' && (
                        <span>{r.almacenOrigen?.nombre} → {r.almacenDestino?.nombre}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.motivoEntrada || r.motivoSalida || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {r._count.detalles}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[r.estado]}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/stock/remisiones/${r.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {r.estado === 'BORRADOR' && (
                          <button onClick={() => confirmar(r.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Confirmar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.estado !== 'ANULADA' && (
                          <button onClick={() => anular(r.id, r.numero)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Anular">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}