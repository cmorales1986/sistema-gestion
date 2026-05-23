// src/app/(main)/bancos/conciliacion/nueva/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Info } from 'lucide-react'
import Link from 'next/link'

type CuentaBancaria = {
  id:           string
  nroCuenta:    string
  saldoActual:  number
  banco:        { nombre: string; codigo: string }
  moneda:       { simbolo: string } | null
}

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }

// Genera el período YYYY-MM a partir de una fecha
function fechaAPeriodo(fecha: string) {
  return fecha.slice(0, 7)
}
// Primer día del mes de una fecha
function primerDiaMes(fecha: string) {
  return fecha.slice(0, 7) + '-01'
}
// Último día del mes de una fecha
function ultimoDiaMes(fecha: string) {
  const [y, m] = fecha.split('-').map(Number)
  const ultimo = new Date(y, m, 0).getDate()
  return `${fecha.slice(0, 7)}-${String(ultimo).padStart(2, '0')}`
}

export default function NuevaConciliacionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const hoy     = new Date().toISOString().split('T')[0]
  const mesActual = hoy.slice(0, 7)

  const [cuentas,   setCuentas]   = useState<CuentaBancaria[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    cuentaId:     '',
    periodo:      mesActual,
    fechaDesde:   primerDiaMes(hoy),
    fechaHasta:   ultimoDiaMes(hoy),
    saldoExtracto: '',
    notas:        '',
  })

  useEffect(() => {
    fetch('/api/bancos/cuentas').then(r => r.json()).then(setCuentas)
  }, [])

  // Cuando cambia el período, ajustar fechas automáticamente
  function handlePeriodo(valor: string) {
    const fechaRef = valor + '-01'
    setForm(prev => ({
      ...prev,
      periodo:    valor,
      fechaDesde: primerDiaMes(fechaRef),
      fechaHasta: ultimoDiaMes(fechaRef),
    }))
  }

  const cuentaSeleccionada = cuentas.find(c => c.id === form.cuentaId)

  async function guardar() {
    if (!form.cuentaId)      { setError('Seleccioná una cuenta bancaria'); return }
    if (!form.saldoExtracto) { setError('Ingresá el saldo según el extracto bancario'); return }

    setGuardando(true)
    setError('')

    const res = await fetch('/api/bancos/conciliacion', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/bancos/conciliacion/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Error al crear la conciliación')
    }
    setGuardando(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/bancos/conciliacion" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva conciliación</h1>
          <p className="text-gray-500 text-sm mt-0.5">Conciliá un período bancario</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 leading-relaxed">
          <p className="font-medium mb-1">¿Cómo funciona?</p>
          <p>Seleccioná la cuenta, el período y el saldo que figura en tu extracto bancario.
          El sistema importa automáticamente los movimientos registrados en el período
          y calcula la diferencia con tus libros.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

        {/* Cuenta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta bancaria *</label>
          <div className="relative">
            <select
              value={form.cuentaId}
              onChange={e => setForm({ ...form, cuentaId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none"
            >
              <option value="">Seleccioná una cuenta</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.banco.nombre} — {c.nroCuenta}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {cuentaSeleccionada && (
            <p className="text-xs text-gray-400 mt-1">
              Saldo actual en libros: <span className="font-semibold text-gray-600">
                {cuentaSeleccionada.moneda?.simbolo || 'Gs.'} {formatGs(cuentaSeleccionada.saldoActual)}
              </span>
            </p>
          )}
        </div>

        {/* Período */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Período *</label>
          <input
            type="month"
            value={form.periodo}
            onChange={e => handlePeriodo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Fechas: {form.fechaDesde} al {form.fechaHasta}
          </p>
        </div>

        {/* Fechas (ajustables manualmente) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              type="date"
              value={form.fechaDesde}
              onChange={e => setForm({ ...form, fechaDesde: e.target.value, periodo: fechaAPeriodo(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={form.fechaHasta}
              onChange={e => setForm({ ...form, fechaHasta: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>
        </div>

        {/* Saldo extracto */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Saldo según extracto bancario *
          </label>
          <input
            type="number"
            min="0"
            value={form.saldoExtracto}
            onChange={e => setForm({ ...form, saldoExtracto: e.target.value })}
            placeholder="Ingresá el saldo que figura en el extracto del banco"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Este es el saldo que figura en el estado de cuenta bancario (extracto).
          </p>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            value={form.notas}
            onChange={e => setForm({ ...form, notas: e.target.value })}
            placeholder="Observaciones sobre esta conciliación"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/bancos/conciliacion"
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: colorPrimario }}
            onMouseEnter={e => !guardando && (e.currentTarget.style.backgroundColor = colorSecundario)}
            onMouseLeave={e => !guardando && (e.currentTarget.style.backgroundColor = colorPrimario)}
          >
            {guardando ? 'Creando...' : 'Crear conciliación →'}
          </button>
        </div>
      </div>
    </div>
  )
}