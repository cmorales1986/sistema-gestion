/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, Percent, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Impuesto = { id: string; nombre: string; porcentaje: number }
const EMPTY = { nombre: '', porcentaje: '' }

export default function ImpuestosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [impuestos, setImpuestos]   = useState<Impuesto[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando]     = useState<Impuesto | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/impuestos')
    setImpuestos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(imp: Impuesto) {
    setEditando(imp)
    setForm({ nombre: imp.nombre, porcentaje: String(imp.porcentaje) })
    setError(''); setDrawerOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true); setError('')

    const url    = editando ? `/api/impuestos/${editando.id}` : '/api/impuestos'
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

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este impuesto?')) return
    await fetch(`/api/impuestos/${id}`, { method: 'DELETE' })
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
          <h1 className="text-2xl font-bold text-gray-900">Impuestos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{impuestos.length} impuesto{impuestos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nuevo impuesto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando impuestos..." />
          </div>
        ) : impuestos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Percent className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay impuestos registrados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Porcentaje</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {impuestos.map((imp, i) => (
                <tr key={imp.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{imp.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {imp.porcentaje}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => abrirEditar(imp)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminar(imp.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        title={editando ? 'Editar impuesto' : 'Nuevo impuesto'}
        footer={footer}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: IVA 10%, Exenta"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Porcentaje *</label>
            <div className="relative">
              <input
                type="number"
                value={form.porcentaje}
                onChange={e => setForm({ ...form, porcentaje: e.target.value })}
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2.5 pr-8 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
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