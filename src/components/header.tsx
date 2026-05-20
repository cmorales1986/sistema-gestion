/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'

function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

export default function Header() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario = user?.colorPrimario  || '#1E3A5F'
  const usuarioNombre = user?.name           || ''
  const rol           = user?.rol            || ''

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">

      {/* Izquierda vacía por ahora — después breadcrumb */}
      <div />

      {/* Derecha */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  )
}