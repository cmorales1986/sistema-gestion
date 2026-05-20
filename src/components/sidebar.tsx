/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Truck, Users, ShoppingCart,
  TrendingUp, Package, FileText, LogOut, ChevronRight,
  Tag, BookOpen, Settings
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/categorias',   label: 'Categorías',   icon: Tag },
  { href: '/articulos',    label: 'Artículos',    icon: BookOpen },
  { href: '/proveedores',  label: 'Proveedores',  icon: Truck },
  { href: '/clientes',     label: 'Clientes',     icon: Users },
  { href: '/compras',      label: 'Compras',      icon: ShoppingCart },
  { href: '/ventas',       label: 'Ventas',       icon: TrendingUp },
  { href: '/stock',        label: 'Stock',        icon: Package },
  { href: '/reportes',     label: 'Reportes',     icon: FileText },
  { href: '/miscelaneos',  label: 'Parámetros',  icon: Settings },
]

function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const user = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'
  const empresaNombre   = user?.empresaNombre   || 'Mi Empresa'

  useEffect(() => {
    fetch('/api/empresa/logo')
      .then(r => r.json())
      .then(data => setLogoUrl(data.logoUrl || null))
  }, [session])

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{ backgroundColor: colorPrimario }}
    >
      {/* Logo / Empresa */}
      <div
        className="flex items-center gap-3 px-5 h-16 border-b shrink-0"
        style={{ borderColor: `${colorSecundario}60` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
          style={{ backgroundColor: colorSecundario }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {getIniciales(empresaNombre)}
            </span>
          )}
        </div>
        <p className="text-white font-bold text-base truncate">
          {empresaNombre}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={isActive
                ? { backgroundColor: colorSecundario, color: '#ffffff' }
                : { color: 'rgba(255,255,255,0.7)' }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = `${colorSecundario}40`
                  e.currentTarget.style.color = '#ffffff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer — solo logout */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: `${colorSecundario}60` }}
      >
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}