/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, LogOut, Building2, ChevronDown, Package, CreditCard, Wallet, FileCheck, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Notificacion = {
  id: string
  tipo: string
  nivel: 'ERROR' | 'WARNING'
  titulo: string
  mensaje: string
  href: string
}

function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

const TIPO_ICON: Record<string, any> = {
  STOCK:    Package,
  PAGO:     CreditCard,
  COBRO:    Wallet,
  TIMBRADO: FileCheck,
  TRIAL:    AlertTriangle,
}

export default function Header() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario = user?.colorPrimario || '#1E3A5F'
  const usuarioNombre = user?.name          || ''
  const rol           = user?.rol           || ''
  const empresaNombre = user?.empresaNombre || ''

  const [userMenuOpen, setUserMenuOpen]       = useState(false)
  const [notiMenuOpen, setNotiMenuOpen]       = useState(false)
  const [notificaciones, setNotificaciones]   = useState<Notificacion[]>([])
  const [totalNotis, setTotalNotis]           = useState(0)
  const [errores, setErrores]                 = useState(0)

  const userRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)

  const cargarNotis = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones')
      const data = await res.json()
      setNotificaciones(data.notificaciones || [])
      setTotalNotis(data.total || 0)
      setErrores(data.errores || 0)
    } catch {}
  }, [])

  useEffect(() => {
    cargarNotis()
    // Recargar cada 5 minutos
    const interval = setInterval(cargarNotis, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cargarNotis])

  // Cerrar al click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setNotiMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div />

      <div className="flex items-center gap-2">

        {/* Notificaciones */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => { setNotiMenuOpen(!notiMenuOpen); setUserMenuOpen(false) }}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {totalNotis > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold ${
                errores > 0 ? 'bg-red-500' : 'bg-orange-400'
              }`}>
                {totalNotis > 9 ? '9+' : totalNotis}
              </span>
            )}
          </button>

          {/* Dropdown notificaciones */}
          {notiMenuOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
                {totalNotis > 0 && (
                  <span className="text-xs text-gray-500">{totalNotis} alerta{totalNotis !== 1 ? 's' : ''}</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Bell className="w-6 h-6 mb-2 opacity-30" />
                    <p className="text-xs">Sin notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map(n => {
                    const Icon = TIPO_ICON[n.tipo] || AlertTriangle
                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotiMenuOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.nivel === 'ERROR' ? 'bg-red-100' : 'bg-orange-100'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${n.nivel === 'ERROR' ? 'text-red-600' : 'text-orange-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900">{n.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>

              {notificaciones.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    onClick={() => { cargarNotis(); setNotiMenuOpen(false) }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Actualizar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Avatar con menú */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotiMenuOpen(false) }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900 leading-tight">{usuarioNombre}</p>
              <p className="text-xs text-gray-400 leading-tight capitalize">{rol?.toLowerCase()}</p>
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: colorPrimario }}
            >
              {getIniciales(usuarioNombre)}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown usuario */}
          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{usuarioNombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{empresaNombre}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1.5 ${
                  rol === 'ADMIN'      ? 'bg-blue-50 text-blue-700' :
                  rol === 'SUPERADMIN' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {rol?.toLowerCase()}
                </span>
              </div>
              <div className="py-1">
                <Link
                  href="/perfil"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Mi Empresa
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}