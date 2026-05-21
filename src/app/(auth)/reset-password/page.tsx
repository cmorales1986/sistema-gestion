/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [password, setPassword]           = useState('')
  const [confirmar, setConfirmar]         = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [loading, setLoading]             = useState(false)
  const [exito, setExito]                 = useState(false)
  const [error, setError]                 = useState('')

  useEffect(() => {
    if (!token) setError('Token inválido o expirado.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8)      { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar)   { setError('Las contraseñas no coinciden'); return }

    setLoading(true); setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (res.ok) {
      setExito(true)
      setTimeout(() => router.push('/login'), 3000)
    } else {
      const data = await res.json()
      setError(data.error || 'Error al restablecer la contraseña')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

      {exito ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-500 text-sm mb-2">Tu contraseña fue restablecida correctamente.</p>
          <p className="text-xs text-gray-400">Redirigiendo al login en unos segundos...</p>
        </div>

      ) : !token ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
          <p className="text-gray-500 text-sm mb-6">Este enlace no es válido o ya expiró.</p>
          <Link href="/forgot-password" className="text-sm font-medium" style={{ color: '#1E3A5F' }}>
            Solicitar nuevo enlace
          </Link>
        </div>

      ) : (
        <>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresá tu nueva contraseña.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Indicador de fuerza */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= i * 3
                        ? password.length >= 12 ? 'bg-green-500'
                          : password.length >= 8 ? 'bg-yellow-400'
                          : 'bg-red-400'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {password.length < 8 ? 'Muy corta' : password.length < 12 ? 'Aceptable' : 'Segura'}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#1E3A5F' }}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}