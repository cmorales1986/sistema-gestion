/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Search, Pencil, Trash2, Package, ChevronDown } from 'lucide-react'
import Drawer from '@/components/drawer'
import Loading from '@/components/loading'

type Categoria = { id: string; nombre: string }
type Impuesto  = { id: string; nombre: string; porcentaje: number }
type Articulo  = {
  id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  unidadMedida: string
  inventariable: boolean
  stockMinimo: number
  precioCompra: number | null
  precioVenta: number | null
  impuesto: { nombre: string; porcentaje: number } | null
  categoria: { nombre: string } | null
  stock: { cantidad: number; almacen: { nombre: string } }[]
}

const EMPTY_FORM = {
  nombre:        '',
  descripcion:   '',
  unidadMedida:  'unidad',
  inventariable: true,
  stockMinimo:   '0',
  precioCompra:  '',
  precioVenta:   '',
  impuestoId:    '',
  categoriaId:   '',
}

const UNIDADES = ['unidad', 'litro', 'kg', 'gramo', 'metro', 'caja', 'bolsa', 'paquete', 'servicio']

function formatGs(n: number) { return new Intl.NumberFormat('es-PY').format(n) }
function stockTotal(stock: { cantidad: number }[]) { return stock.reduce((acc, s) => acc + s.cantidad, 0) }

export default function ArticulosPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'

  const [articulos, setArticulos]   = useState<Articulo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [impuestos, setImpuestos]   = useState<Impuesto[]>([])
  const [busqueda, setBusqueda]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editando, setEditando]     = useState<Articulo | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/articulos?q=${busqueda}`)
    setArticulos(await res.json())
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    fetch('/api/categorias').then(r => r.json()).then(setCategorias)
    fetch('/api/impuestos').then(r => r.json()).then(setImpuestos)
  }, [])

  function abrirCrear() {
    setEditando(null); setForm(EMPTY_FORM); setError(''); setDrawerOpen(true)
  }

  function abrirEditar(a: Articulo) {
    setEditando(a)
    setForm({
      nombre:        a.nombre,
      descripcion:   a.descripcion   || '',
      unidadMedida:  a.unidadMedida,
      inventariable: a.inventariable,
      stockMinimo:   String(a.stockMinimo),
      precioCompra:  a.precioCompra  ? String(a.precioCompra) : '',
      precioVenta:   a.precioVenta   ? String(a.precioVenta)  : '',
      impuestoId:    '',
      categoriaId:   '',
    })
    setError(''); setDrawerOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true); setError('')

    const url    = editando ? `/api/articulos/${editando.id}` : '/api/articulos'
    const method = editando ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) { setDrawerOpen(false); cargar() }
    else setError('Error al guardar')
    setGuardando(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este artículo?')) return
    await fetch(`/api/articulos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const drawerFooter = (
    <div className="flex gap-3">
      <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50" style={{ backgroundColor: colorPrimario }}>
        {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear artículo'}
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artículos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{articulos.length} artículo{articulos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = colorSecundario}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = colorPrimario}
        >
          <Plus className="w-4 h-4" /> Nuevo artículo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm"><Loading texto="Cargando Artículos..." /></div>
        ) : articulos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No hay artículos registrados</p>
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
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Categoría</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Unidad</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Impuesto</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Compra</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">P. Venta</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {articulos.map((a, i) => {
                const stock     = stockTotal(a.stock)
                const stockBajo = a.inventariable && stock <= a.stockMinimo
                return (
                  <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{a.codigo || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                      {a.descripcion && <p className="text-xs text-gray-400 mt-0.5">{a.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.categoria?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{a.unidadMedida}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {a.impuesto ? `${a.impuesto.nombre} (${a.impuesto.porcentaje}%)` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {a.precioCompra ? `Gs. ${formatGs(a.precioCompra)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {a.precioVenta ? `Gs. ${formatGs(a.precioVenta)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.inventariable ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockBajo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                          {formatGs(stock)} {a.unidadMedida}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No inventariable</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminar(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editando ? 'Editar artículo' : 'Nuevo artículo'}
        subtitle={editando?.codigo || undefined}
        footer={drawerFooter}
      >
        <div className="space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
            <div className="relative">
              <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none">
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del artículo" autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción opcional" rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unidad de medida</label>
              <div className="relative">
                <select value={form.unidadMedida} onChange={e => setForm({ ...form, unidadMedida: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none">
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Impuesto</label>
              <div className="relative">
                <select value={form.impuestoId} onChange={e => setForm({ ...form, impuestoId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none">
                  <option value="">Sin impuesto</option>
                  {impuestos.map(imp => (
                    <option key={imp.id} value={imp.id}>{imp.nombre} ({imp.porcentaje}%)</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Precio compra (Gs.) <span className="text-gray-400 font-normal">— promedio ponderado</span>
              </label>
              <div className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500">
                {form.precioCompra
                  ? new Intl.NumberFormat('es-PY').format(Number(form.precioCompra))
                  : 'Se calcula automáticamente con las compras'
                }
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Precio venta (Gs.)</label>
              <input type="number" value={form.precioVenta} min="0" placeholder="0"
                onChange={e => setForm({ ...form, precioVenta: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Inventariable</p>
              <p className="text-xs text-gray-400 mt-0.5">Controla stock de este artículo</p>
            </div>
            <button type="button" onClick={() => setForm({ ...form, inventariable: !form.inventariable })}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              style={{ backgroundColor: form.inventariable ? colorPrimario : '#d1d5db' }}>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: form.inventariable ? 'translateX(22px)' : 'translateX(2px)' }} />
            </button>
          </div>

          {form.inventariable && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input type="number" value={form.stockMinimo} min="0" placeholder="0"
                onChange={e => setForm({ ...form, stockMinimo: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          )}

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