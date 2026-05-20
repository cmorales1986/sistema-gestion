/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, FileCheck, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'

type Timbrado = {
  id: string
  numero: string
  serie1: string
  serie2: string
  desde: number
  hasta: number
  siguiente: number
  fechaInicio: string
  fechaVencimiento: string
  activo: boolean
}

const EMPTY = {
  numero:           '',
  serie1:           '001',
  serie2:           '001',
  desde:            '1',
  hasta:            '9999999',
  fechaInicio:      new Date().toISOString().split('T')[0],
  fechaVencimiento: '',
  activo:           true,
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function nroEjemplo(t: Timbrado) {
  return `${t.serie1}-${t.serie2}-${String(t.siguiente).padStart(7, '0')}`
}

function estadoTimbrado(t: Timbrado) {
  const hoy = new Date()
  const vence = new Date(t.fechaVencimiento)
  if (!t.activo) return { label: 'Inactivo', style: 'bg-gray-100 text-gray-600' }
  if (vence < hoy) return { label: 'Vencido', style: 'bg-red-50 text-red-600' }
  if (t.siguiente > t.hasta) return { label: 'Sin números', style: 'bg-orange-50 text-orange-600' }
  return { label: 'Activo', style: 'bg-green-50 text-green-700' }
}

export default function TimbradosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [timbrados, setTimbrados]   = useState<Timbrado[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando]     = useState<Timbrado | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/timbrados')
    setTimbrados(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(t: Timbrado) {
    setEditando(t)
    setForm({
      numero:           t.numero,
      serie1:           t.serie1,
      serie2:           t.serie2,
      desde:            String(t.desde),
      hasta:            String(t.hasta),
      fechaInicio:      t.fechaInicio.split('T')[0],
      fechaVencimiento: t.fechaVencimiento.split('T')[0],
      activo:           t.activo,
    })
    setError(''); setDrawerOpen(true)
  }

  async function guardar() {
    if (!form.numero.trim())          { setError('El número de timbrado es requerido'); return }
    if (!form.fechaVencimiento)       { setError('La fecha de vencimiento es requerida'); return }
    if (parseInt(form.desde) < 1)     { setError('La numeración desde debe ser mayor a 0'); return }
    if (parseInt(form.hasta) <= parseInt(form.desde)) { setError('La numeración hasta debe ser mayor que desde'); return }

    setGuardando(true); setError('')

    const url    = editando ? `/api/timbrados/${editando.id}` : '/api/timbrados'
    const method = editando ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
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

  async function eliminar(t: Timbrado) {
    if (t.activo) { alert('No podés eliminar el timbrado activo'); return }
    if (!confirm(`¿Eliminar el timbrado ${t.numero}?`)) return
    await fetch(`/api/timbrados/${t.id}`, { method: 'DELETE' })
    cargar()
  }

  const footer = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
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
          <h1 className="text-2xl font-bold text-gray-900">Timbrados</h1>
          <p className="text-gray-500 text-sm mt-0.5">{timbrados.length} timbrado{timbrados.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nuevo timbrado
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : timbrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileCheck className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay timbrados configurados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Timbrado</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Serie</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Numeración</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Próximo Nro.</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Vigencia</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {timbrados.map((t, i) => {
                const estado = estadoTimbrado(t)
                return (
                  <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.activo && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        <span className="text-sm font-mono font-medium text-gray-900">{t.numero}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{t.serie1}-{t.serie2}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {String(t.desde).padStart(7, '0')} — {String(t.hasta).padStart(7, '0')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: colorPrimario }}>
                      {nroEjemplo(t)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatFecha(t.fechaInicio)} — {formatFecha(t.fechaVencimiento)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.style}`}>
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!t.activo && (
                          <button onClick={() => eliminar(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editando ? 'Editar timbrado' : 'Nuevo timbrado'}
        subtitle={editando ? `Timbrado ${editando.numero}` : undefined}
        footer={footer}
      >
        <div className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Número de timbrado *</label>
            <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
              placeholder="Ej: 12345678" autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent font-mono" />
            <p className="text-xs text-gray-400 mt-1">Número otorgado por la SET</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Serie del establecimiento</label>
            <div className="flex items-center gap-2">
              <input value={form.serie1} onChange={e => setForm({ ...form, serie1: e.target.value })}
                placeholder="001" maxLength={3}
                className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none focus:ring-2 focus:border-transparent" />
              <span className="text-gray-400 font-bold">—</span>
              <input value={form.serie2} onChange={e => setForm({ ...form, serie2: e.target.value })}
                placeholder="001" maxLength={3}
                className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none focus:ring-2 focus:border-transparent" />
              <span className="text-xs text-gray-400">Ej: 001-001</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Numeración</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input type="number" value={form.desde} min="1"
                  onChange={e => setForm({ ...form, desde: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
              <span className="text-gray-400 mt-5">—</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input type="number" value={form.hasta} min="1"
                  onChange={e => setForm({ ...form, hasta: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
            </div>
            {form.serie1 && form.serie2 && form.desde && (
              <p className="text-xs mt-1.5" style={{ color: colorPrimario }}>
                Próxima factura: {form.serie1.padStart(3,'0')}-{form.serie2.padStart(3,'0')}-{String(parseInt(form.desde) || 1).padStart(7,'0')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input type="date" value={form.fechaInicio}
                onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha vencimiento *</label>
              <input type="date" value={form.fechaVencimiento}
                onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Timbrado activo</p>
              <p className="text-xs text-gray-400 mt-0.5">Se usará en las nuevas facturas de venta</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, activo: !form.activo })}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: form.activo ? colorPrimario : '#d1d5db' }}>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: form.activo ? 'translateX(22px)' : 'translateX(2px)' }} />
            </button>
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