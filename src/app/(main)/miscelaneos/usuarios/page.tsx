/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, UserCog, Shield, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'OPERADOR' | 'SUPERADMIN'
  activo: boolean
  createdAt: string
}

const EMPTY_FORM = {
  nombre:   '',
  email:    '',
  password: '',
  rol:      'OPERADOR',
}

const ROL_STYLE: Record<string, string> = {
  SUPERADMIN: 'bg-purple-50 text-purple-700',
  ADMIN:      'bg-blue-50 text-blue-700',
  OPERADOR:   'bg-gray-100 text-gray-600',
}

const ROL_ICON: Record<string, typeof Shield> = {
  SUPERADMIN: Shield,
  ADMIN:      Shield,
  OPERADOR:   User,
}

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'
  const miId            = user?.id

  const [usuarios, setUsuarios]         = useState<Usuario[]>([])
  const [loading, setLoading]           = useState(true)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editando, setEditando]         = useState<Usuario | null>(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/usuarios')
    setUsuarios(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY_FORM); setError(''); setShowPassword(false); setDrawerOpen(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setError(''); setShowPassword(false); setDrawerOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (!form.email.trim())  { setError('El email es requerido'); return }
    if (!editando && !form.password) { setError('La contraseña es requerida'); return }

    setGuardando(true); setError('')

    const url    = editando ? `/api/usuarios/${editando.id}` : '/api/usuarios'
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

  async function eliminar(u: Usuario) {
    if (u.id === miId) { alert('No podés eliminar tu propio usuario'); return }
    if (!confirm(`¿Eliminar al usuario "${u.nombre}"?`)) return
    await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' })
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
        {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear usuario'}
      </button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/miscelaneos"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <Loading texto="Cargando usuarios..." />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserCog className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay usuarios registrados</p>
            <button onClick={abrirCrear} className="mt-3 text-sm font-medium" style={{ color: colorPrimario }}>
              + Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Rol</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => {
                const RolIcon = ROL_ICON[u.rol] || User
                return (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: colorPrimario }}
                        >
                          {u.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                          {u.id === miId && (
                            <p className="text-xs text-gray-400">Vos</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROL_STYLE[u.rol]}`}>
                        <RolIcon className="w-3 h-3" />
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFecha(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => abrirEditar(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.id !== miId && (
                          <button onClick={() => eliminar(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle={editando?.email}
        footer={footer}
      >
        <div className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre completo"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contraseña {editando && <span className="text-gray-400 font-normal">(dejá vacío para no cambiar)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editando ? '••••••••' : 'Mínimo 8 caracteres'}
                minLength={editando ? undefined : 8}
                className="w-full px-3 py-2.5 pr-11 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Rol *</label>
            <div className="grid grid-cols-2 gap-2">
              {['ADMIN', 'OPERADOR'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, rol: r })}
                  className="py-3 rounded-lg text-sm font-medium border-2 transition-all flex flex-col items-center gap-1"
                  style={form.rol === r
                    ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}10`, color: colorPrimario }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {r === 'ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {form.rol === 'ADMIN'
                ? 'Acceso completo al sistema incluyendo configuración.'
                : 'Acceso operativo — compras, ventas, stock.'
              }
            </p>
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