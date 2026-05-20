/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, DollarSign, ArrowLeft, Star, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'

type TipoCambio = { id: string; fecha: string; valor: number }
type Moneda = {
  id: string
  codigo: string
  nombre: string
  simbolo: string
  principal: boolean
  tiposCambio: TipoCambio[]
}

const EMPTY_MONEDA   = { codigo: '', nombre: '', simbolo: '', principal: false }
const MONEDAS_PRESET = [
  { codigo: 'PYG', nombre: 'Guaraní',      simbolo: 'Gs.' },
  { codigo: 'USD', nombre: 'Dólar',        simbolo: '$'   },
  { codigo: 'BRL', nombre: 'Real',         simbolo: 'R$'  },
  { codigo: 'ARS', nombre: 'Peso Arg.',    simbolo: '$'   },
  { codigo: 'EUR', nombre: 'Euro',         simbolo: '€'   },
]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(n) }
function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MonedasPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [monedas, setMonedas]           = useState<Moneda[]>([])
  const [loading, setLoading]           = useState(true)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [drawerTCOpen, setDrawerTCOpen] = useState(false)
  const [editando, setEditando]         = useState<Moneda | null>(null)
  const [monedaTC, setMonedaTC]         = useState<Moneda | null>(null)
  const [form, setForm]                 = useState(EMPTY_MONEDA)
  const [formTC, setFormTC]             = useState({ valor: '', fecha: new Date().toISOString().split('T')[0] })
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/monedas')
    setMonedas(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY_MONEDA); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(m: Moneda) {
    setEditando(m)
    setForm({ codigo: m.codigo, nombre: m.nombre, simbolo: m.simbolo, principal: m.principal })
    setError(''); setDrawerOpen(true)
  }

  function abrirTipoCambio(m: Moneda) {
    setMonedaTC(m)
    setFormTC({ valor: '', fecha: new Date().toISOString().split('T')[0] })
    setError(''); setDrawerTCOpen(true)
  }

  function usarPreset(p: typeof MONEDAS_PRESET[0]) {
    setForm({ ...form, codigo: p.codigo, nombre: p.nombre, simbolo: p.simbolo })
  }

  async function guardar() {
    if (!form.codigo.trim() || !form.nombre.trim() || !form.simbolo.trim()) {
      setError('Todos los campos son requeridos'); return
    }
    setGuardando(true); setError('')

    const url    = editando ? `/api/monedas/${editando.id}` : '/api/monedas'
    const method = editando ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) { setDrawerOpen(false); cargar() }
    else setError('Error al guardar')
    setGuardando(false)
  }

  async function guardarTC() {
    if (!formTC.valor || !monedaTC) { setError('El valor es requerido'); return }
    setGuardando(true); setError('')

    const res = await fetch('/api/tipos-cambio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monedaId: monedaTC.id, ...formTC }),
    })

    if (res.ok) { setDrawerTCOpen(false); cargar() }
    else setError('Error al guardar')
    setGuardando(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta moneda?')) return
    await fetch(`/api/monedas/${id}`, { method: 'DELETE' })
    cargar()
  }

  const footerMoneda = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
      </button>
    </div>
  )

  const footerTC = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerTCOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button onClick={guardarTC} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : 'Guardar tipo de cambio'}
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/miscelaneos" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Monedas y Tipos de Cambio</h1>
          <p className="text-gray-500 text-sm mt-0.5">{monedas.length} moneda{monedas.length !== 1 ? 's' : ''} configurada{monedas.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nueva moneda
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : monedas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <DollarSign className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay monedas configuradas</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar la primera
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Moneda</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Código</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Símbolo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Último tipo de cambio</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {monedas.map((m, i) => {
                const ultimoTC = m.tiposCambio[0]
                return (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.principal && (
                          <Star className="w-3.5 h-3.5 fill-current" style={{ color: colorPrimario }} />
                        )}
                        <span className="text-sm font-medium text-gray-900">{m.nombre}</span>
                        {m.principal && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${colorPrimario}15`, color: colorPrimario }}>
                            Principal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{m.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.simbolo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {ultimoTC ? `Gs. ${formatGs(ultimoTC.valor)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ultimoTC ? formatFecha(ultimoTC.fecha) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!m.principal && (
                          <button
                            onClick={() => abrirTipoCambio(m)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Actualizar tipo de cambio"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => abrirEditar(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!m.principal && (
                          <button onClick={() => eliminar(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
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

      {/* Drawer Moneda */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editando ? 'Editar moneda' : 'Nueva moneda'}
        footer={footerMoneda}
      >
        <div className="space-y-4">

          {/* Presets */}
          {!editando && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Seleccioná una moneda común</label>
              <div className="flex flex-wrap gap-2">
                {MONEDAS_PRESET.map(p => (
                  <button
                    key={p.codigo}
                    type="button"
                    onClick={() => usarPreset(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all"
                    style={form.codigo === p.codigo
                      ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}10`, color: colorPrimario }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                    }
                  >
                    {p.codigo} — {p.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Código *</label>
              <input
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="USD"
                maxLength={5}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Símbolo *</label>
              <input
                value={form.simbolo}
                onChange={e => setForm({ ...form, simbolo: e.target.value })}
                placeholder="$"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Dólar americano"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Moneda principal</p>
              <p className="text-xs text-gray-400 mt-0.5">Moneda base de la empresa</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, principal: !form.principal })}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: form.principal ? colorPrimario : '#d1d5db' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: form.principal ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Drawer Tipo de Cambio */}
      <Drawer
        open={drawerTCOpen}
        onClose={() => setDrawerTCOpen(false)}
        title={`Tipo de cambio — ${monedaTC?.codigo}`}
        subtitle={monedaTC?.nombre}
        footer={footerTC}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Último valor registrado</p>
            <p className="text-lg font-bold text-gray-900">
              {monedaTC?.tiposCambio[0]
                ? `Gs. ${formatGs(monedaTC.tiposCambio[0].valor)}`
                : 'Sin registro'
              }
            </p>
            {monedaTC?.tiposCambio[0] && (
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFecha(monedaTC.tiposCambio[0].fecha)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={formTC.fecha}
              onChange={e => setFormTC({ ...formTC, fecha: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Valor en Gs. *
            </label>
            <input
              type="number"
              value={formTC.valor}
              onChange={e => setFormTC({ ...formTC, valor: e.target.value })}
              placeholder="Ej: 7500"
              min="0"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Cuántos guaraníes vale 1 {monedaTC?.codigo}</p>
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