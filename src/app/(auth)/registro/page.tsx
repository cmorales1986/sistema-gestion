'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, X } from 'lucide-react'

type Plan = {
  id: string
  nombre: string
  precio: number
  descripcion: string | null
}

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

export default function RegistroPage() {
  const [paso, setPaso]               = useState(1)
  const [planes, setPlanes]           = useState<Plan[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    empresaNombre:   '',
    planId:          '',
    adminNombre:     '',
    adminEmail:      '',
    adminPassword:   '',
    colorPrimario:   '#1E3A5F',
    colorSecundario: '#2E6DA4',
    logoUrl:         '',
  })

  useEffect(() => {
    fetch('/api/planes').then(r => r.json()).then(setPlanes)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function seleccionarColor(primario: string, secundario: string) {
    setForm({ ...form, colorPrimario: primario, colorSecundario: secundario })
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) { setError('El logo no debe superar 1MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setLogoPreview(base64)
      setForm({ ...form, logoUrl: base64 })
    }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    setLogoPreview(null)
    setForm({ ...form, logoUrl: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function formatPrecio(precio: number) {
    return new Intl.NumberFormat('es-PY').format(precio)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:        form.empresaNombre,
        nombreUsuario: form.adminNombre,
        email:         form.adminEmail,
        password:      form.adminPassword,
        planId:        form.planId,
        colorPrimario:   form.colorPrimario,
        colorSecundario: form.colorSecundario,
        logoUrl:         form.logoUrl,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al registrar')
      setLoading(false)
      return
    }

    setExito(true)
    setLoading(false)
  }

  // ── ÉXITO ──
  if (exito) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Recibimos tu solicitud de registro para <strong>{form.empresaNombre}</strong>.
          Te avisaremos por email a <strong>{form.adminEmail}</strong> cuando tu cuenta sea aprobada.
        </p>
        <p className="text-xs text-gray-400 mb-6">Tiempo estimado: dentro de las próximas horas.</p>
        
         <a href="https://wa.me/595981612950"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors mb-4"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contactar por WhatsApp
        </a>
        <div>
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">

      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 overflow-hidden"
          style={{ backgroundColor: logoPreview ? 'transparent' : form.colorPrimario }}
        >
          {logoPreview ? (
            <Image src={logoPreview} alt="Logo" width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <span className="text-white text-2xl font-bold">
              {form.empresaNombre ? form.empresaNombre[0].toUpperCase() : 'G'}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Registrá tu empresa</h1>
        <p className="text-gray-500 text-sm mt-1">
          {paso === 1 ? 'Paso 1 de 2 — Datos de la empresa' : 'Paso 2 de 2 — Tu cuenta de administrador'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: paso === 1 ? '50%' : '100%', backgroundColor: form.colorPrimario }}
        />
      </div>

      <form onSubmit={paso === 1 ? (e) => { e.preventDefault(); setError(''); setPaso(2) } : handleSubmit}>

        {/* ── PASO 1 ── */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
              <input name="empresaNombre" value={form.empresaNombre} onChange={handleChange} required
                placeholder="Ej: Fuel Oil S.A."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              {logoPreview ? (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Image src={logoPreview} alt="Logo" width={48} height={48} className="w-12 h-12 object-contain rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">Logo cargado</p>
                    <p className="text-xs text-gray-400">Se mostrará en el sistema</p>
                  </div>
                  <button type="button" onClick={removeLogo} className="text-red-400 hover:text-red-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all flex flex-col items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Subir logo</span>
                  <span className="text-xs text-gray-400">PNG, JPG hasta 1MB</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} className="hidden" />
            </div>

            {/* Planes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elegí tu plan</label>
              <div className="space-y-2">
                {planes.map(plan => (
                  <label key={plan.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all"
                    style={form.planId === plan.id
                      ? { borderColor: form.colorPrimario, backgroundColor: `${form.colorPrimario}10` }
                      : { borderColor: '#e5e7eb' }
                    }>
                    <input type="radio" name="planId" value={plan.id} checked={form.planId === plan.id}
                      onChange={handleChange} className="hidden" required />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{plan.nombre}</p>
                      {plan.descripcion && <p className="text-xs text-gray-500 mt-0.5">{plan.descripcion}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-gray-900 text-sm">Gs. {formatPrecio(plan.precio)}</p>
                      <p className="text-xs text-gray-500">/ mes</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Colores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de tu marca</label>
              <div className="flex gap-2 flex-wrap">
                {COLORES_PRESET.map(c => (
                  <button key={c.primario} type="button" onClick={() => seleccionarColor(c.primario, c.secundario)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.colorPrimario === c.primario ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.primario }} title={c.label} />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button type="submit" disabled={!form.empresaNombre || !form.planId}
              className="w-full text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-2"
              style={{ backgroundColor: form.colorPrimario }}>
              Continuar
            </button>
          </div>
        )}

        {/* ── PASO 2 ── */}
        {paso === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
              <input name="adminNombre" value={form.adminNombre} onChange={handleChange} required
                placeholder="Nombre completo"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} required
                placeholder="tu@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input name="adminPassword" type={showPassword ? 'text' : 'password'}
                  value={form.adminPassword} onChange={handleChange} required minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setPaso(1)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                Volver
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: form.colorPrimario }}>
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: form.colorPrimario }}>
          Ingresá acá
        </Link>
      </p>
    </div>
  )
}