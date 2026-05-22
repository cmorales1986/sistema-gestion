/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type Banco  = { id: string; nombre: string; codigo: string }
type Moneda = { id: string; codigo: string; nombre: string; simbolo: string }

export default function NuevaCuentaBancariaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [bancos, setBancos]   = useState<Banco[]>([])
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    bancoId:      '',
    nroCuenta:    '',
    descripcion:  '',
    monedaId:     '',
    saldoInicial: '0',
  })

  useEffect(() => {
    fetch('/api/bancos').then(r => r.json()).then(setBancos)
    fetch('/api/monedas').then(r => r.json()).then(setMonedas)
  }, [])

  async function guardar() {
    if (!form.bancoId)   { setError('Seleccioná un banco'); return }
    if (!form.nroCuenta) { setError('Ingresá el número de cuenta'); return }

    setGuardando(true); setError('')

    const res = await fetch('/api/bancos/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/bancos')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setGuardando(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/bancos" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva cuenta bancaria</h1>
          <p className="text-gray-500 text-sm mt-0.5">Agregá una cuenta bancaria de tu empresa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Banco *</label>
          <div className="relative">
            <select value={form.bancoId} onChange={e => setForm({ ...form, bancoId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Seleccioná un banco</option>
              {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {bancos.length === 0 && (
            <p className="text-xs text-orange-500 mt-1">
              No hay bancos configurados.{' '}
              <Link href="/miscelaneos/bancos" className="underline">Configurar bancos</Link>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nro. de cuenta *</label>
          <input value={form.nroCuenta} onChange={e => setForm({ ...form, nroCuenta: e.target.value })}
            placeholder="Ej: 123456789"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent font-mono" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
          <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Cuenta corriente principal"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Moneda</label>
          <div className="relative">
            <select value={form.monedaId} onChange={e => setForm({ ...form, monedaId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
              <option value="">Guaraní (PYG)</option>
              {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Saldo inicial</label>
          <input type="number" min="0" value={form.saldoInicial}
            onChange={e => setForm({ ...form, saldoInicial: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent" />
          <p className="text-xs text-gray-400 mt-1">Saldo actual de la cuenta al momento de registrarla</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/bancos" className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-center">
            Cancelar
          </Link>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: colorPrimario }}>
            {guardando ? 'Guardando...' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}