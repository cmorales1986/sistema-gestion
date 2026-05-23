/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, CalendarRange, ArrowLeft, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Periodo = {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: 'ABIERTO' | 'CERRADO'
}

const EMPTY = {
  nombre:      '',
  fechaInicio: '',
  fechaFin:    '',
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

function getMesesPreset() {
  const hoy   = new Date()
  const anio  = hoy.getFullYear()
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses.map((m, i) => ({
    nombre:      `${m} ${anio}`,
    fechaInicio: new Date(anio, i, 1).toISOString().split('T')[0],
    fechaFin:    new Date(anio, i + 1, 0).toISOString().split('T')[0],
  }))
}

export default function PeriodosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [periodos, setPeriodos]       = useState<Periodo[]>([])
  const [loading, setLoading]         = useState(true)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editando, setEditando]       = useState<Periodo | null>(null)
  const [form, setForm]               = useState(EMPTY)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/periodos')
    setPeriodos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(p: Periodo) {
    if (p.estado === 'CERRADO') return
    setEditando(p)
    setForm({
      nombre:      p.nombre,
      fechaInicio: p.fechaInicio.split('T')[0],
      fechaFin:    p.fechaFin.split('T')[0],
    })
    setError(''); setDrawerOpen(true)
  }

  function usarPreset(p: ReturnType<typeof getMesesPreset>[0]) {
    setForm({ nombre: p.nombre, fechaInicio: p.fechaInicio, fechaFin: p.fechaFin })
  }

  async function guardar() {
    if (!form.nombre.trim())      { setError('El nombre es requerido'); return }
    if (!form.fechaInicio)        { setError('La fecha de inicio es requerida'); return }
    if (!form.fechaFin)           { setError('La fecha de fin es requerida'); return }
    if (form.fechaInicio > form.fechaFin) { setError('La fecha de inicio debe ser menor a la de fin'); return }

    setGuardando(true); setError('')

    const url    = editando ? `/api/periodos/${editando.id}` : '/api/periodos'
    const method = editando ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setDrawerOpen(false); cargar()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setGuardando(false)
  }

  async function cambiarEstado(p: Periodo) {
    const nuevoEstado = p.estado === 'ABIERTO' ? 'CERRADO' : 'ABIERTO'
    const accion      = nuevoEstado === 'CERRADO' ? 'cerrar' : 'reabrir'
    if (!confirm(`¿Querés ${accion} el período "${p.nombre}"?`)) return

    await fetch(`/api/periodos/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    cargar()
  }

  async function eliminar(p: Periodo) {
    if (p.estado === 'CERRADO') return
    if (!confirm(`¿Eliminar el período "${p.nombre}"?`)) return
    const res = await fetch(`/api/periodos/${p.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error)
      return
    }
    cargar()
  }

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={() => setDrawerOpen(false)}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={guardar}
        disabled={guardando}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: colorPrimario }}
      >
        {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
      </button>
    </div>
  )

  const mesesPreset = getMesesPreset()

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/miscelaneos" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Períodos Contables</h1>
          <p className="text-gray-500 text-sm mt-0.5">{periodos.length} período{periodos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nuevo período
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando períodos..." />
          </div>
        ) : periodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarRange className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay períodos registrados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha inicio</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fecha fin</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {periodos.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(p.fechaInicio)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFecha(p.fechaFin)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.estado === 'ABIERTO'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.estado === 'ABIERTO'
                        ? <Unlock className="w-3 h-3" />
                        : <Lock className="w-3 h-3" />
                      }
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => cambiarEstado(p)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          p.estado === 'ABIERTO'
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={p.estado === 'ABIERTO' ? 'Cerrar período' : 'Reabrir período'}
                      >
                        {p.estado === 'ABIERTO' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      {p.estado === 'ABIERTO' && (
                        <>
                          <button onClick={() => abrirEditar(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => eliminar(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editando ? 'Editar período' : 'Nuevo período contable'}
        footer={footer}
      >
        <div className="space-y-4">

          {!editando && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Meses del año actual</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                {mesesPreset.map(m => (
                  <button
                    key={m.nombre}
                    type="button"
                    onClick={() => usarPreset(m)}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium border-2 transition-all text-center"
                    style={form.nombre === m.nombre
                      ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}10`, color: colorPrimario }
                      : { borderColor: '#e5e7eb', color: '#6b7280' }
                    }
                  >
                    {m.nombre.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Enero 2025, Q1 2025"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin *</label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
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