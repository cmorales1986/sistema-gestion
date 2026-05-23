/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Search, ChevronDown, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Loading from '@/components/loading'

type Usuario  = { id: string; nombre: string; email: string }
type Registro = {
  id:          string
  modulo:      string
  accion:      string
  descripcion: string
  metadata:    any
  createdAt:   string
  usuario:     { nombre: string; email: string } | null
}

const MODULOS = ['VENTAS', 'COMPRAS', 'COBROS', 'PAGOS', 'CAJA', 'STOCK', 'ARTICULOS', 'CLIENTES', 'PROVEEDORES', 'USUARIOS', 'EMPRESA']
const ACCIONES = ['CREAR', 'EDITAR', 'ANULAR', 'ELIMINAR', 'PAGO', 'COBRO', 'APERTURA_CAJA', 'CIERRE_CAJA']

const MODULO_COLOR: Record<string, string> = {
  VENTAS:      'bg-blue-50 text-blue-700',
  COMPRAS:     'bg-purple-50 text-purple-700',
  COBROS:      'bg-green-50 text-green-700',
  PAGOS:       'bg-orange-50 text-orange-700',
  CAJA:        'bg-yellow-50 text-yellow-700',
  STOCK:       'bg-teal-50 text-teal-700',
  ARTICULOS:   'bg-indigo-50 text-indigo-700',
  CLIENTES:    'bg-pink-50 text-pink-700',
  PROVEEDORES: 'bg-red-50 text-red-700',
  USUARIOS:    'bg-gray-100 text-gray-700',
  EMPRESA:     'bg-slate-50 text-slate-700',
}

const ACCION_COLOR: Record<string, string> = {
  CREAR:         'bg-green-50 text-green-700',
  EDITAR:        'bg-blue-50 text-blue-700',
  ANULAR:        'bg-red-50 text-red-600',
  ELIMINAR:      'bg-red-50 text-red-600',
  PAGO:          'bg-orange-50 text-orange-700',
  COBRO:         'bg-teal-50 text-teal-700',
  APERTURA_CAJA: 'bg-yellow-50 text-yellow-700',
  CIERRE_CAJA:   'bg-yellow-50 text-yellow-700',
}

function formatFechaHora(f: string) {
  return new Date(f).toLocaleString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function AuditoriaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [registros, setRegistros]   = useState<Registro[]>([])
  const [usuarios, setUsuarios]     = useState<Usuario[]>([])
  const [loading, setLoading]       = useState(false)
  const [expandido, setExpandido]   = useState<string | null>(null)
  const [filtros, setFiltros]       = useState({
    desde:     inicioMes,
    hasta:     hoy,
    modulo:    '',
    accion:    '',
    usuarioId: '',
  })

  // Redirigir si es OPERADOR
  useEffect(() => {
    if (session && user?.rol === 'OPERADOR') {
      router.push('/dashboard')
    }
  }, [session, user, router])

  useEffect(() => {
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(setUsuarios)
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.desde)     params.set('desde',     filtros.desde)
    if (filtros.hasta)     params.set('hasta',     filtros.hasta)
    if (filtros.modulo)    params.set('modulo',    filtros.modulo)
    if (filtros.accion)    params.set('accion',    filtros.accion)
    if (filtros.usuarioId) params.set('usuarioId', filtros.usuarioId)
    const res = await fetch(`/api/reportes/auditoria?${params}`)
    setRegistros(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  // Stats
  const porModulo = MODULOS.reduce((acc, m) => {
    acc[m] = registros.filter(r => r.modulo === m).length
    return acc
  }, {} as Record<string, number>)

  const topModulo = Object.entries(porModulo).sort((a, b) => b[1] - a[1])[0]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reportes" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{registros.length} registros encontrados</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total registros</p>
          <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Módulo más activo</p>
          <p className="text-lg font-bold text-gray-900">{topModulo?.[0] || '—'}</p>
          <p className="text-xs text-gray-400">{topModulo?.[1] || 0} registros</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Anulaciones</p>
          <p className="text-2xl font-bold text-red-600">
            {registros.filter(r => r.accion === 'ANULAR').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Usuarios activos</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(registros.map(r => r.usuario?.email).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-6 gap-3">
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Módulo</label>
            <div className="relative">
              <select value={filtros.modulo}
                onChange={e => setFiltros({ ...filtros, modulo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                <option value="">Todos</option>
                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Acción</label>
            <div className="relative">
              <select value={filtros.accion}
                onChange={e => setFiltros({ ...filtros, accion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                <option value="">Todas</option>
                {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Usuario</label>
            <div className="relative">
              <select value={filtros.usuarioId}
                onChange={e => setFiltros({ ...filtros, usuarioId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                <option value="">Todos</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={cargar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colorPrimario }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando registros..." />
          </div>
        ) : registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Shield className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay registros en el período seleccionado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha y hora</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Módulo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Acción</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                      {formatFechaHora(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{r.usuario?.nombre || 'Sistema'}</p>
                      <p className="text-xs text-gray-400">{r.usuario?.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MODULO_COLOR[r.modulo] || 'bg-gray-100 text-gray-600'}`}>
                        {r.modulo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACCION_COLOR[r.accion] || 'bg-gray-100 text-gray-600'}`}>
                        {r.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                      {r.descripcion}
                    </td>
                    <td className="px-4 py-3">
                      {r.metadata && (
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandido === r.id ? 'rotate-180' : ''}`} />
                      )}
                    </td>
                  </tr>

                  {/* Detalle expandido */}
                  {expandido === r.id && r.metadata && (
                    <tr key={`${r.id}-detail`} className="border-b border-gray-100 bg-blue-50/30">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">DETALLE</p>
                        <div className="grid grid-cols-4 gap-3">
                          {Object.entries(r.metadata).map(([key, value]) => (
                            value !== null && value !== undefined && (
                              <div key={key} className="bg-white rounded-lg p-3 border border-gray-100">
                                <p className="text-xs text-gray-400 mb-0.5 uppercase">{key}</p>
                                <p className="text-sm font-medium text-gray-900 break-all">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </p>
                              </div>
                            )
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}