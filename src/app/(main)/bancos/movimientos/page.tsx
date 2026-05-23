/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrowLeft, Plus, Search, Trash2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type CuentaBancaria = {
  id:    string
  nroCuenta: string
  banco: { nombre: string }
}
type Movimiento = {
  id:             string
  tipo:           string
  concepto:       string
  monto:          number
  fecha:          string
  estado:         string
  referenciaTipo: string | null
  cuenta: {
    nroCuenta: string
    banco: { nombre: string }
  }
}

const hoy       = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MovimientosBancariosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [cuentas, setCuentas]         = useState<CuentaBancaria[]>([])
  const [loading, setLoading]         = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')

  const [filtros, setFiltros] = useState({ cuentaId: '', desde: inicioMes, hasta: hoy })
  const [form, setForm]       = useState({
    cuentaId: '',
    tipo:     'CREDITO',
    concepto: '',
    monto:    '',
    fecha:    hoy,
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.cuentaId) params.set('cuentaId', filtros.cuentaId)
    if (filtros.desde)    params.set('desde',    filtros.desde)
    if (filtros.hasta)    params.set('hasta',    filtros.hasta)
    const res = await fetch(`/api/bancos/movimientos?${params}`)
    setMovimientos(await res.json())
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetch('/api/bancos/cuentas').then(r => r.json()).then(setCuentas) }, [])

  async function guardar() {
    if (!form.cuentaId) { setError('Seleccioná una cuenta'); return }
    if (!form.concepto) { setError('Ingresá el concepto'); return }
    if (!form.monto)    { setError('Ingresá el monto'); return }
    setGuardando(true); setError('')

    const res = await fetch('/api/bancos/movimientos', {
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

  const totalCreditos = movimientos.filter(m => m.tipo === 'CREDITO').reduce((a, m) => a + m.monto, 0)
  const totalDebitos  = movimientos.filter(m => m.tipo === 'DEBITO').reduce((a, m) => a + m.monto, 0)

  const footer = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : 'Registrar'}
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
          <h1 className="text-2xl font-bold text-gray-900">Movimientos bancarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{movimientos.length} movimientos</p>
        </div>
        <button onClick={() => { setForm({ cuentaId: '', tipo: 'CREDITO', concepto: '', monto: '', fecha: hoy }); setError(''); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
          <Plus className="w-4 h-4" /> Nuevo movimiento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total créditos</p>
          <p className="text-xl font-bold text-green-600">+ Gs. {formatGs(totalCreditos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total débitos</p>
          <p className="text-xl font-bold text-red-600">- Gs. {formatGs(totalDebitos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Neto del período</p>
          <p className={`text-xl font-bold ${totalCreditos - totalDebitos >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            Gs. {formatGs(totalCreditos - totalDebitos)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta</label>
            <select value={filtros.cuentaId} onChange={e => setFiltros({ ...filtros, cuentaId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Todas</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco.nombre} — {c.nroCuenta}</option>)}
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
            <Loading texto="Cargando movimientos..." />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            No hay movimientos en el período
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Cuenta</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Concepto</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Origen</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Crédito</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Débito</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(m.fecha)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{m.cuenta.banco.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.cuenta.nroCuenta}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{m.concepto}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {m.referenciaTipo || 'MANUAL'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right">
                    {m.tipo === 'CREDITO' ? <span className="text-green-600">+ Gs. {formatGs(m.monto)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right">
                    {m.tipo === 'DEBITO' ? <span className="text-red-600">- Gs. {formatGs(m.monto)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.estado === 'CONCILIADO' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-600">TOTALES</td>
                <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">+ Gs. {formatGs(totalCreditos)}</td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">- Gs. {formatGs(totalDebitos)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Nuevo movimiento" footer={footer}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta bancaria *</label>
            <div className="relative">
              <select value={form.cuentaId} onChange={e => setForm({ ...form, cuentaId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                <option value="">Seleccioná una cuenta</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco.nombre} — {c.nroCuenta}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipo *</label>
            <div className="grid grid-cols-2 gap-2">
              {['CREDITO', 'DEBITO'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, tipo: t })}
                  className="py-2.5 rounded-lg text-sm font-medium border-2 transition-all"
                  style={form.tipo === t
                    ? { borderColor: t === 'CREDITO' ? '#16a34a' : '#dc2626', backgroundColor: t === 'CREDITO' ? '#f0fdf4' : '#fef2f2', color: t === 'CREDITO' ? '#16a34a' : '#dc2626' }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }>
                  {t === 'CREDITO' ? '+ Crédito' : '- Débito'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Concepto *</label>
            <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })}
              placeholder="Ej: Depósito de cobro" autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
            <input type="number" min="0" value={form.monto}
              onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
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