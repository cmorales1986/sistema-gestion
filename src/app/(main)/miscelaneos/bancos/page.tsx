/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, ArrowLeft, Banknote } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Banco = { id: string; nombre: string; codigo: string; activo: boolean }
const EMPTY = { nombre: '', codigo: '' }

export default function BancosParamsPage() {
  const { data: session } = useSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [bancos, setBancos]         = useState<Banco[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando]     = useState<Banco | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/bancos')
    setBancos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(b: Banco) {
    setEditando(b)
    setForm({ nombre: b.nombre, codigo: b.codigo })
    setError(''); setDrawerOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (!form.codigo.trim()) { setError('El código es requerido'); return }
    setGuardando(true); setError('')

    const url    = editando ? `/api/bancos/${editando.id}` : '/api/bancos'
    const method = editando ? 'PUT' : 'POST'

    const res = await fetch(url, {
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

  const footer = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
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
          <h1 className="text-2xl font-bold text-gray-900">Bancos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{bancos.length} banco{bancos.length !== 1 ? 's' : ''} configurado{bancos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
          <Plus className="w-4 h-4" /> Nuevo banco
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando bancos..." />
          </div>
        ) : bancos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Banknote className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay bancos configurados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Código</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nombre</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bancos.map((b, i) => (
                <tr key={b.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 font-mono">
                      {b.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.nombre}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirEditar(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editando ? 'Editar banco' : 'Nuevo banco'} footer={footer}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Código *</label>
            <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="Ej: ITAU, BNF, VISION" autoFocus maxLength={10}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent uppercase" />
            <p className="text-xs text-gray-400 mt-1">Código corto del banco (máx. 10 caracteres)</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Banco Itaú Paraguay"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
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