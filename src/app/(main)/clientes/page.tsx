/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, Hash } from 'lucide-react'
import Loading from '@/components/loading'

type Cliente = {
  id: string
  nombre: string
  ruc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
}

const EMPTY: Omit<Cliente, 'id'> = {
  nombre: '', ruc: '', telefono: '', email: '', direccion: ''
}

export default function ClientesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [clientes, setClientes]       = useState<Cliente[]>([])
  const [busqueda, setBusqueda]       = useState('')
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editando, setEditando]       = useState<Cliente | null>(null)
  const [form, setForm]               = useState(EMPTY)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/clientes?q=${busqueda}`)
    const data = await res.json()
    setClientes(data)
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  function abrirEditar(c: Cliente) {
    setEditando(c)
    setForm({ nombre: c.nombre, ruc: c.ruc || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '' })
    setError('')
    setModalOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true)
    setError('')

    const url    = editando ? `/api/clientes/${editando.id}` : '/api/clientes'
    const method = editando ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setModalOpen(false)
      cargar()
    } else {
      setError('Error al guardar')
    }
    setGuardando(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    cargar()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RUC o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando clientes..." />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No hay clientes registrados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">RUC</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Teléfono</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Dirección</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" />{c.ruc || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.telefono || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{c.direccion || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminar(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editando ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <div className="space-y-3">
              {[
                { name: 'nombre',    label: 'Nombre *',  placeholder: 'Nombre del cliente' },
                { name: 'ruc',       label: 'RUC',       placeholder: '80012345-6' },
                { name: 'telefono',  label: 'Teléfono',  placeholder: '0981 123 456' },
                { name: 'email',     label: 'Email',     placeholder: 'cliente@email.com' },
                { name: 'direccion', label: 'Dirección', placeholder: 'Dirección del cliente' },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={(form as any)[name]}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalOpen(false)}
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
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}