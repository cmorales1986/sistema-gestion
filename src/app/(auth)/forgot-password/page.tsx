'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresá tu email'); return }

    setLoading(true); setError('')

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setEnviado(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Error al enviar el email')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

      {enviado ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Email enviado!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Si existe una cuenta con <span className="font-medium text-gray-700">{email}</span>, vas a recibir un email con las instrucciones para restablecer tu contraseña.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            El enlace vence en 1 hora. Revisá también tu carpeta de spam.
          </p>
          <Link href="/login" className="text-sm font-medium" style={{ color: '#1E3A5F' }}>
            ← Volver al login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Link href="/login" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Olvidé mi contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">
              Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

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
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}