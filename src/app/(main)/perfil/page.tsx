/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Save, Upload, X } from 'lucide-react'
import Image from 'next/image'

const COLORES_PRESET = [
  { primario: '#1E3A5F', secundario: '#2E6DA4', label: 'Azul oscuro' },
  { primario: '#1a5c38', secundario: '#2d9e63', label: 'Verde' },
  { primario: '#7c1d1d', secundario: '#c0392b', label: 'Rojo' },
  { primario: '#4a1a6b', secundario: '#8e44ad', label: 'Violeta' },
  { primario: '#1a4a6b', secundario: '#2980b9', label: 'Celeste' },
  { primario: '#5c4a1a', secundario: '#d4a017', label: 'Dorado' },
  { primario: '#b8860b', secundario: '#f0c040', label: 'Amarillo' },
  { primario: '#c45c00', secundario: '#e07b20', label: 'Naranja' },
  { primario: '#1a6b6b', secundario: '#20a0a0', label: 'Teal' },
  { primario: '#2d2d2d', secundario: '#555555', label: 'Gris oscuro' },
  { primario: '#6b1a3a', secundario: '#a02060', label: 'Rosa' },
  { primario: '#1a3a1a', secundario: '#3a6b3a', label: 'Verde oscuro' },
]

function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const user = session?.user as any
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre:          '',
    colorPrimario:   '#1E3A5F',
    colorSecundario: '#2E6DA4',
    logoUrl:         '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [plan, setPlan]               = useState<{ nombre: string; precio: number } | null>(null)
  const [estado, setEstado]           = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [mensaje, setMensaje]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetch('/api/empresa/perfil')
      .then(r => r.json())
      .then(data => {
        setForm({
          nombre:          data.nombre,
          colorPrimario:   data.colorPrimario,
          colorSecundario: data.colorSecundario,
          logoUrl:         data.logoUrl || '',
        })
        if (data.logoUrl) setLogoPreview(data.logoUrl)
        setPlan(data.plan)
        setEstado(data.estado)
        setFechaVencimiento(data.fechaVencimiento)
        setLoading(false)
      })
  }, [])

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('El logo no debe superar 2MB'); return }

    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 120
      let w = img.width, h = img.height
      if (w > h) { h = Math.round(h * MAX / w); w = MAX }
      else { w = Math.round(w * MAX / h); h = MAX }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const base64 = canvas.toDataURL('image/webp', 0.7)
      setLogoPreview(base64)
      setForm(prev => ({ ...prev, logoUrl: base64 }))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function removeLogo() {
    setLogoPreview(null)
    setForm(prev => ({ ...prev, logoUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function seleccionarColor(primario: string, secundario: string) {
    setForm(prev => ({ ...prev, colorPrimario: primario, colorSecundario: secundario }))
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true); setError(''); setMensaje('')

    const res = await fetch('/api/empresa/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setMensaje('Cambios guardados correctamente. Recargá la página para ver los cambios en el sidebar.')
      // Actualizar sesión
      await update()
    } else {
      setError('Error al guardar')
    }
    setGuardando(false)
  }

  function formatFecha(f: string) {
    return new Date(f).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(n) }

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Empresa</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configurá la identidad visual de tu empresa</p>
      </div>

      <div className="space-y-4">

        {/* Info del plan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Información de la cuenta</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Plan actual</p>
              <p className="text-sm font-semibold text-gray-900">{plan?.nombre || '—'}</p>
              {plan && <p className="text-xs text-gray-400">Gs. {formatGs(plan.precio)}/mes</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                estado === 'ACTIVO'     ? 'bg-green-50 text-green-700' :
                estado === 'TRIAL'      ? 'bg-blue-50 text-blue-700' :
                'bg-red-50 text-red-600'
              }`}>
                {estado}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Vencimiento</p>
              <p className="text-sm font-medium text-gray-900">{formatFecha(fechaVencimiento)}</p>
            </div>
          </div>
        </div>

        {/* Identidad visual */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Identidad visual</h2>

          <div className="space-y-5">

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: form.colorPrimario }}
              >
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-white font-bold text-lg">{getIniciales(form.nombre)}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900" style={{ color: form.colorPrimario }}>{form.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">Así se verá en el sidebar</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: form.colorPrimario }} />
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: form.colorSecundario }} />
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre de tu empresa"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Logo <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              {logoPreview ? (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Image src={logoPreview} alt="Logo" width={48} height={48} className="w-12 h-12 object-contain rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">Logo cargado</p>
                    <p className="text-xs text-gray-400">Se mostrará en el sidebar</p>
                  </div>
                  <button onClick={removeLogo} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all flex flex-col items-center gap-1"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span>Subir logo</span>
                  <span className="text-xs text-gray-400">PNG, JPG hasta 2MB</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} className="hidden" />
            </div>

            {/* Colores */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Color de la marca</label>
              <div className="flex flex-wrap gap-2">
                {COLORES_PRESET.map(c => (
                  <button
                    key={c.primario}
                    onClick={() => seleccionarColor(c.primario, c.secundario)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.colorPrimario === c.primario ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.primario }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {mensaje && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-green-700 text-sm">{mensaje}</p>
          </div>
        )}

        {/* Botón guardar */}
        <div className="flex justify-end pb-6">
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: form.colorPrimario }}
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}