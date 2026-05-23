/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/rules-of-hooks */
// src/app/(dashboard)/stock/remisiones/nueva/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePlan } from '@/lib/use-plan'
import ModuloBloqueado from '@/components/modulo-bloqueado'
import { ArrowLeft, Plus, Trash2, ChevronDown, Search, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

type Almacen  = { id: string; nombre: string }
type Articulo = { id: string; codigo: string | null; nombre: string; unidadMedida: string; precioCompra: number | null }

type DetalleForm = {
  articuloId:  string
  nombre:      string
  unidadMedida: string
  cantidad:    number
  precioUnit:  number | null
}

const MOTIVOS_ENTRADA = [
  { value: 'REMISION_COMPRA',    label: 'Remisión de compra' },
  { value: 'DEVOLUCION_CLIENTE', label: 'Devolución de cliente' },
  { value: 'DONACION',           label: 'Donación / regalo recibido' },
  { value: 'AJUSTE_POSITIVO',    label: 'Ajuste positivo de inventario' },
  { value: 'OTRO',               label: 'Otro' },
]

const MOTIVOS_SALIDA = [
  { value: 'REMISION_VENTA',    label: 'Remisión de venta' },
  { value: 'PERDIDA',           label: 'Pérdida / robo / siniestro' },
  { value: 'VENCIMIENTO',       label: 'Vencimiento o deterioro' },
  { value: 'MUESTRA',           label: 'Muestra comercial' },
  { value: 'AJUSTE_NEGATIVO',   label: 'Ajuste negativo de inventario' },
  { value: 'OTRO',              label: 'Otro' },
]

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) }

export default function NuevaRemisionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { tieneModulo } = usePlan()

  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  // Guard Pro
  if (!tieneModulo('STOCK_AVANZADO') && !tieneModulo('REMISIONES')) {
    return (
      <ModuloBloqueado
        modulo="Remisiones y movimientos de stock"
        descripcion="Disponible en el plan Pro."
      />
    )
  }

  const [almacenes,     setAlmacenes]     = useState<Almacen[]>([])
  const [todosArticulos, setTodosArticulos] = useState<Articulo[]>([])
  const [articulosFiltrados, setArticulosFiltrados] = useState<Articulo[]>([])
  const [busqArticulo,  setBusqArticulo]  = useState('')
  const [showBusq,      setShowBusq]      = useState(false)
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState('')

  const [form, setForm] = useState({
    tipo:             'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA',
    fecha:            new Date().toISOString().split('T')[0],
    almacenOrigenId:  '',
    almacenDestinoId: '',
    motivoEntrada:    '',
    motivoSalida:     '',
    esFiscal:         false,
    nroComprobante:   '',
    timbradoNro:      '',
    serie1:           '001',
    serie2:           '001',
    observacion:      '',
    estado:           'CONFIRMADA' as 'BORRADOR' | 'CONFIRMADA',
  })

  const [detalles, setDetalles] = useState<DetalleForm[]>([])

  useEffect(() => {
    fetch('/api/almacenes').then(r => r.json()).then(setAlmacenes)
    fetch('/api/articulos?limit=9999').then(r => r.json()).then(data => {
      setTodosArticulos(data)
      setArticulosFiltrados(data)
    })
  }, [])

  useEffect(() => {
    const q = busqArticulo.trim().toLowerCase()
    if (!q) { setArticulosFiltrados(todosArticulos); return }
    setArticulosFiltrados(
      todosArticulos.filter(a =>
        a.nombre.toLowerCase().includes(q) ||
        (a.codigo && a.codigo.toLowerCase().includes(q))
      )
    )
  }, [busqArticulo, todosArticulos])

  // Limpiar almacenes al cambiar tipo
  useEffect(() => {
    setForm(prev => ({ ...prev, almacenOrigenId: '', almacenDestinoId: '', motivoEntrada: '', motivoSalida: '' }))
  }, [form.tipo])

  function agregarArticulo(a: Articulo) {
    if (detalles.find(d => d.articuloId === a.id)) {
      setBusqArticulo(''); setShowBusq(false); return
    }
    setDetalles(prev => [...prev, {
      articuloId:   a.id,
      nombre:       a.nombre,
      unidadMedida: a.unidadMedida,
      cantidad:     1,
      precioUnit:   a.precioCompra || null,
    }])
    setBusqArticulo(''); setShowBusq(false)
  }

  function actualizarDetalle(idx: number, campo: string, valor: any) {
    setDetalles(prev => prev.map((d, i) => i === idx ? { ...d, [campo]: valor } : d))
  }

  async function guardar(estado: 'BORRADOR' | 'CONFIRMADA') {
    setError('')
    if (!form.fecha) { setError('La fecha es requerida'); return }
    if (form.tipo === 'ENTRADA' && !form.almacenDestinoId) { setError('Seleccioná el almacén de destino'); return }
    if (form.tipo === 'SALIDA'  && !form.almacenOrigenId)  { setError('Seleccioná el almacén de origen'); return }
    if (form.tipo === 'TRANSFERENCIA' && (!form.almacenOrigenId || !form.almacenDestinoId)) {
      setError('Seleccioná almacén origen y destino'); return
    }
    if (detalles.length === 0) { setError('Agregá al menos un artículo'); return }

    setGuardando(true)
    const res = await fetch('/api/remisiones', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        estado,
        detalles: detalles.map(d => ({
          articuloId: d.articuloId,
          cantidad:   d.cantidad,
          precioUnit: d.precioUnit,
        })),
      }),
    })

    if (res.ok) {
      router.push('/stock/remisiones')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    }
    setGuardando(false)
  }

  const TIPO_OPTS = [
    { value: 'ENTRADA',       label: 'Entrada de mercadería',  icon: TrendingUp,     color: '#16a34a' },
    { value: 'SALIDA',        label: 'Salida de mercadería',   icon: TrendingDown,   color: '#dc2626' },
    { value: 'TRANSFERENCIA', label: 'Transferencia entre almacenes', icon: ArrowLeftRight, color: '#2563eb' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/stock/remisiones" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva remisión</h1>
          <p className="text-gray-500 text-sm mt-0.5">Movimiento de mercadería sin factura</p>
        </div>
      </div>

      <div className="space-y-4">

        {/* Tipo de movimiento */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de movimiento</h2>
          <div className="grid grid-cols-3 gap-3">
            {TIPO_OPTS.map(t => {
              const Icon = t.icon
              const activo = form.tipo === t.value
              return (
                <button key={t.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipo: t.value as any }))}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  style={activo
                    ? { borderColor: t.color, backgroundColor: `${t.color}12`, color: t.color }
                    : { borderColor: '#d1d5db', color: '#111827', backgroundColor: '#f9fafb' }
                  }>
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-semibold text-center">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Datos del movimiento */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Datos del movimiento</h2>
          <div className="grid grid-cols-2 gap-4">

            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2" />
            </div>

            {/* Motivo */}
            {form.tipo === 'ENTRADA' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                <div className="relative">
                  <select value={form.motivoEntrada}
                    onChange={e => setForm({ ...form, motivoEntrada: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                    <option value="">Seleccioná motivo</option>
                    {MOTIVOS_ENTRADA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {form.tipo === 'SALIDA' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                <div className="relative">
                  <select value={form.motivoSalida}
                    onChange={e => setForm({ ...form, motivoSalida: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                    <option value="">Seleccioná motivo</option>
                    {MOTIVOS_SALIDA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Almacén origen (SALIDA y TRANSFERENCIA) */}
            {(form.tipo === 'SALIDA' || form.tipo === 'TRANSFERENCIA') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Almacén origen *
                </label>
                <div className="relative">
                  <select value={form.almacenOrigenId}
                    onChange={e => setForm({ ...form, almacenOrigenId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                    <option value="">Seleccioná almacén</option>
                    {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Almacén destino (ENTRADA y TRANSFERENCIA) */}
            {(form.tipo === 'ENTRADA' || form.tipo === 'TRANSFERENCIA') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Almacén destino *
                </label>
                <div className="relative">
                  <select value={form.almacenDestinoId}
                    onChange={e => setForm({ ...form, almacenDestinoId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none appearance-none">
                    <option value="">Seleccioná almacén</option>
                    {almacenes
                      .filter(a => form.tipo !== 'TRANSFERENCIA' || a.id !== form.almacenOrigenId)
                      .map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* ¿Es fiscal? */}
            <div className="col-span-2">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                style={form.esFiscal
                  ? { borderColor: colorPrimario, backgroundColor: `${colorPrimario}08` }
                  : { borderColor: '#e5e7eb' }
                }>
                <input type="checkbox" checked={form.esFiscal}
                  onChange={e => setForm({ ...form, esFiscal: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Es documento fiscal (remisión SET)</p>
                  <p className="text-xs text-gray-500">Activá si tiene número de timbrado y datos fiscales</p>
                </div>
              </label>
            </div>

            {/* Datos fiscales */}
            {form.esFiscal && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nro. timbrado</label>
                  <input value={form.timbradoNro}
                    onChange={e => setForm({ ...form, timbradoNro: e.target.value })}
                    placeholder="Ej: 12345678"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Serie y número</label>
                  <div className="flex items-center gap-2">
                    <input value={form.serie1} maxLength={3}
                      onChange={e => setForm({ ...form, serie1: e.target.value })}
                      className="w-16 px-2 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none" />
                    <span className="text-gray-400">—</span>
                    <input value={form.serie2} maxLength={3}
                      onChange={e => setForm({ ...form, serie2: e.target.value })}
                      className="w-16 px-2 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none" />
                    <span className="text-gray-400">—</span>
                    <input value={form.nroComprobante}
                      onChange={e => setForm({ ...form, nroComprobante: e.target.value })}
                      placeholder="0000001"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none" />
                  </div>
                </div>
              </>
            )}

            {/* Observación */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observación</label>
              <textarea value={form.observacion}
                onChange={e => setForm({ ...form, observacion: e.target.value })}
                placeholder="Observaciones opcionales" rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Artículos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Artículos</h2>
            <div className="relative">
              <button onClick={() => { setShowBusq(!showBusq); setBusqArticulo('') }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: colorPrimario }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}>
                <Plus className="w-4 h-4" /> Agregar artículo
              </button>

              {showBusq && (
                <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-80">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input autoFocus value={busqArticulo}
                        onChange={e => setBusqArticulo(e.target.value)}
                        placeholder="Buscar por nombre o código..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 pl-1">
                      {articulosFiltrados.length} artículo{articulosFiltrados.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {articulosFiltrados.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin resultados</p>
                    ) : (
                      articulosFiltrados.map(a => (
                        <button key={a.id} onClick={() => agregarArticulo(a)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                              <p className="text-xs text-gray-400">{a.codigo ? `${a.codigo} · ` : ''}{a.unidadMedida}</p>
                            </div>
                            {detalles.find(d => d.articuloId === a.id) && (
                              <span className="text-xs text-green-600 font-medium">Agregado</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {detalles.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">No hay artículos agregados</p>
              <p className="text-xs mt-1">Hacé click en "Agregar artículo" para empezar</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2">Artículo</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 w-28">Cantidad</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 w-32">Precio unit. (opt.)</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, i) => (
                  <tr key={d.articuloId} className="border-b border-gray-50">
                    <td className="py-2 pr-3">
                      <p className="text-sm font-medium text-gray-900">{d.nombre}</p>
                      <p className="text-xs text-gray-400">{d.unidadMedida}</p>
                    </td>
                    <td className="py-2 px-1">
                      <input type="number" min="0.01" step="0.01" value={d.cantidad}
                        onChange={e => actualizarDetalle(i, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-full text-right px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none" />
                    </td>
                    <td className="py-2 px-1">
                      <input type="number" min="0" value={d.precioUnit ?? ''}
                        onChange={e => actualizarDetalle(i, 'precioUnit', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Opcional"
                        className="w-full text-right px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none placeholder:text-gray-300" />
                    </td>
                    <td className="py-2 pl-2">
                      <button onClick={() => setDetalles(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 justify-end pb-6">
          <Link href="/stock/remisiones"
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button onClick={() => guardar('BORRADOR')} disabled={guardando}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors disabled:opacity-50"
            style={{ borderColor: colorPrimario, color: colorPrimario }}>
            Guardar borrador
          </button>
          <button onClick={() => guardar('CONFIRMADA')} disabled={guardando}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: colorPrimario }}>
            {guardando ? 'Guardando...' : 'Confirmar y mover stock'}
          </button>
        </div>
      </div>
    </div>
  )
}