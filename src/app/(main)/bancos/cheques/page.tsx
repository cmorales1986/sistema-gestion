/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, ArrowLeft, ChevronDown, Search } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Banco = { id: string; nombre: string; codigo: string }
type Cheque = {
  id:           string
  tipo:         string
  movimiento:   string
  nroCheque:    string
  monto:        number
  fechaEmision: string
  fechaPago:    string
  diasDiferido: number
  estado:       string
  beneficiario: string | null
  emisor:       string | null
  observacion:  string | null
  banco:        { nombre: string; codigo: string } | null
}

const ESTADOS = ['EN_CARTERA', 'A_DEPOSITAR', 'DEPOSITADO', 'ACREDITADO', 'RECHAZADO', 'ANULADO', 'ENTREGADO']

const ESTADO_STYLE: Record<string, string> = {
  EN_CARTERA:   'bg-blue-50 text-blue-700',
  A_DEPOSITAR:  'bg-yellow-50 text-yellow-700',
  DEPOSITADO:   'bg-orange-50 text-orange-700',
  ACREDITADO:   'bg-green-50 text-green-700',
  RECHAZADO:    'bg-red-50 text-red-600',
  ANULADO:      'bg-gray-100 text-gray-500',
  ENTREGADO:    'bg-purple-50 text-purple-700',
}

const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM = {
  movimiento:   'RECIBIDO',
  nroCheque:    '',
  bancoId:      '',
  bancoNombre:  '',
  monto:        '',
  fechaEmision: hoy,
  fechaPago:    hoy,
  beneficiario: '',
  emisor:       '',
  observacion:  '',
}

export default function ChequesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [cheques, setCheques]   = useState<Cheque[]>([])
  const [bancos, setBancos]     = useState<Banco[]>([])
  const [loading, setLoading]   = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState(EMPTY_FORM)

  const [filtros, setFiltros] = useState({
    movimiento: '',
    estado:     '',
    desde:      inicioMes,
    hasta:      hoy,
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.movimiento) params.set('movimiento', filtros.movimiento)
    if (filtros.estado)     params.set('estado',     filtros.estado)
    if (filtros.desde)      params.set('desde',      filtros.desde)
    if (filtros.hasta)      params.set('hasta',      filtros.hasta)
    const res = await fetch(`/api/bancos/cheques?${params}`)
    setCheques(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetch('/api/bancos').then(r => r.json()).then(setBancos) }, [])

  // Calcular días diferido automáticamente
  const diasDiferido = Math.max(0, Math.ceil(
    (new Date(form.fechaPago).getTime() - new Date(form.fechaEmision).getTime()) / (1000 * 60 * 60 * 24)
  ))

  async function guardar() {
    if (!form.nroCheque) { setError('Ingresá el número de cheque'); return }
    if (!form.monto)     { setError('Ingresá el monto'); return }
    setGuardando(true); setError('')

    const res = await fetch('/api/bancos/cheques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) { setDrawerOpen(false); cargar() }
    else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setGuardando(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/bancos/cheques/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    cargar()
  }

  const totalRecibidos = cheques.filter(c => c.movimiento === 'RECIBIDO' && c.estado !== 'ANULADO').reduce((a, c) => a + c.monto, 0)
  const totalEmitidos  = cheques.filter(c => c.movimiento === 'EMITIDO'  && c.estado !== 'ANULADO').reduce((a, c) => a + c.monto, 0)

  const footer = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : 'Registrar cheque'}
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/bancos" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Cheques</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cheques.length} cheque{cheques.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setError(''); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
          <Plus className="w-4 h-4" /> Registrar cheque
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cheques recibidos</p>
          <p className="text-xl font-bold text-green-600">Gs. {formatGs(totalRecibidos)}</p>
          <p className="text-xs text-gray-400">{cheques.filter(c => c.movimiento === 'RECIBIDO').length} cheques</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cheques emitidos</p>
          <p className="text-xl font-bold text-red-600">Gs. {formatGs(totalEmitidos)}</p>
          <p className="text-xs text-gray-400">{cheques.filter(c => c.movimiento === 'EMITIDO').length} cheques</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Por acreditar</p>
          <p className="text-xl font-bold text-yellow-600">
            Gs. {formatGs(cheques.filter(c => ['EN_CARTERA', 'A_DEPOSITAR', 'DEPOSITADO'].includes(c.estado)).reduce((a, c) => a + c.monto, 0))}
          </p>
          <p className="text-xs text-gray-400">{cheques.filter(c => ['EN_CARTERA', 'A_DEPOSITAR', 'DEPOSITADO'].includes(c.estado)).length} cheques</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select value={filtros.movimiento} onChange={e => setFiltros({ ...filtros, movimiento: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              <option value="RECIBIDO">Recibidos</option>
              <option value="EMITIDO">Emitidos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todos</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
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
            <Loading texto="Cargando cheques..." />
          </div>
        ) : cheques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No hay cheques en el período</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nro. Cheque</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Banco</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Emisión</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha pago</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Diferido</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Monto</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {cheques.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{c.nroCheque}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.movimiento === 'RECIBIDO' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {c.movimiento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.banco?.nombre || c.movimiento === 'RECIBIDO' ? c.banco?.nombre || '—' : c.banco?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(c.fechaEmision)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(c.fechaPago)}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {c.diasDiferido > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {c.diasDiferido}d
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">Gs. {formatGs(c.monto)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[c.estado]}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.estado !== 'ANULADO' && c.estado !== 'ACREDITADO' && (
                      <div className="relative">
                        <select
                          value={c.estado}
                          onChange={e => cambiarEstado(c.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none appearance-none pr-6"
                        >
                          {ESTADOS.filter(e => e !== 'ANULADO').map(e => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer nuevo cheque */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Registrar cheque" footer={footer}>
        <div className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de movimiento *</label>
            <div className="grid grid-cols-2 gap-2">
              {['RECIBIDO', 'EMITIDO'].map(m => (
                <button key={m} type="button"
                  onClick={() => setForm({ ...form, movimiento: m })}
                  className="py-2.5 rounded-lg text-sm font-medium border-2 transition-all"
                  style={form.movimiento === m
                    ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}10`, color: colorPrimario }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }>
                  {m === 'RECIBIDO' ? '📥 Recibido' : '📤 Emitido'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nro. de cheque *</label>
            <input value={form.nroCheque} onChange={e => setForm({ ...form, nroCheque: e.target.value })}
              placeholder="Ej: 000123456" autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Banco</label>
            <div className="relative">
              <select value={form.bancoId} onChange={e => setForm({ ...form, bancoId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                <option value="">Seleccioná un banco</option>
                {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
            <input type="number" min="0" value={form.monto}
              onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha emisión *</label>
              <input type="date" value={form.fechaEmision}
                onChange={e => setForm({ ...form, fechaEmision: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de pago *</label>
              <input type="date" value={form.fechaPago}
                onChange={e => setForm({ ...form, fechaPago: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          </div>

          {diasDiferido > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-blue-700 text-xs">
                📅 Cheque diferido — {diasDiferido} día{diasDiferido !== 1 ? 's' : ''} hasta la fecha de pago
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {form.movimiento === 'RECIBIDO' ? 'Emisor (quién lo entregó)' : 'Beneficiario (a quién se lo diste)'}
            </label>
            <input
              value={form.movimiento === 'RECIBIDO' ? form.emisor : form.beneficiario}
              onChange={e => setForm(form.movimiento === 'RECIBIDO'
                ? { ...form, emisor: e.target.value }
                : { ...form, beneficiario: e.target.value }
              )}
              placeholder="Nombre"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observación</label>
            <textarea value={form.observacion}
              onChange={e => setForm({ ...form, observacion: e.target.value })}
              placeholder="Opcional" rows={2}
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