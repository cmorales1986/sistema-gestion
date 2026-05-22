/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Truck, Users, ShoppingCart,
  TrendingUp, Package, FileText, ChevronRight,
  Tag, BookOpen, Settings, Building2, ChevronDown,
  Landmark, Lock, Banknote,
} from 'lucide-react'

type NavItem = {
  href?:     string
  label:     string
  icon:      any
  modulo?:   string
  children?: { href: string; label: string; modulo?: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/categorias',  label: 'Categorías',  icon: Tag },
  { href: '/articulos',   label: 'Artículos',   icon: BookOpen },
  { href: '/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/clientes',    label: 'Clientes',    icon: Users },
  {
    label: 'Compras',
    icon: ShoppingCart,
    children: [
      { href: '/compras',       label: 'Facturas' },
      { href: '/compras/pagos', label: 'Pagos a proveedores' },
    ],
  },
  {
    label: 'Ventas',
    icon: TrendingUp,
    children: [
      { href: '/ventas',        label: 'Facturas' },
      { href: '/ventas/cobros', label: 'Cobros de clientes' },
    ],
  },
  {
    label: 'Tesorería',
    icon: Landmark,
    children: [
      { href: '/caja',   label: 'Caja' },
      { href: '/bancos', label: 'Bancos', modulo: 'BANCOS' },
    ],
  },
  { href: '/stock',       label: 'Stock',       icon: Package },
  { href: '/reportes',    label: 'Reportes',    icon: FileText },
  { href: '/miscelaneos', label: 'Parámetros',  icon: Settings },
  { href: '/perfil',      label: 'Mi Empresa',  icon: Building2 },
]

function getIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [logoUrl, setLogoUrl]     = useState<string | null>(null)
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const user            = session?.user as any
  const colorPrimario   = user?.colorPrimario  || '#1E3A5F'
  const colorSecundario = user?.colorSecundario || '#2E6DA4'
  const empresaNombre   = user?.empresaNombre   || 'Mi Empresa'
  const modulos         = (user?.modulos        || []) as string[]

  useEffect(() => {
    fetch('/api/empresa/logo')
      .then(r => r.json())
      .then(data => setLogoUrl(data.logoUrl || null))
  }, [session])

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(c => pathname.startsWith(c.href))
        if (isActive && !openMenus.includes(item.label)) {
          setOpenMenus(prev => [...prev, item.label])
        }
      }
    })
  }, [pathname])

  function toggleMenu(label: string) {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== '/dashboard' &&
        pathname.startsWith(href + '/') &&
        !pathname.includes('/pagos') &&
        !pathname.includes('/cobros'))
    )
  }

  function isActiveChild(href: string) {
    if (href === '/compras') return pathname === '/compras' || (pathname.startsWith('/compras/') && !pathname.startsWith('/compras/pagos'))
    if (href === '/ventas')  return pathname === '/ventas'  || (pathname.startsWith('/ventas/')  && !pathname.startsWith('/ventas/cobros'))
    return pathname === href || pathname.startsWith(href + '/')
  }

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
            <Image src={logoUrl} alt="Logo" width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-white font-bold text-sm">{getIniciales(empresaNombre)}</span>
          )}
        </div>
        <p className="text-white font-bold text-base truncate">{empresaNombre}</p>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${colorSecundario}60 transparent`,
        }}
      >
        {NAV_ITEMS.map(item => {

          // Item con submenú
          if (item.children) {
            const isOpen         = openMenus.includes(item.label)
            const hasActiveChild = item.children.some(c => isActiveChild(c.href))
            const Icon           = item.icon

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={hasActiveChild
                    ? { backgroundColor: `${colorSecundario}60`, color: '#ffffff' }
                    : { color: 'rgba(255,255,255,0.7)' }
                  }
                  onMouseEnter={e => {
                    if (!hasActiveChild) {
                      e.currentTarget.style.backgroundColor = `${colorSecundario}40`
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!hasActiveChild) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                    }
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {isOpen && (
                  <div
                    className="ml-4 mt-0.5 space-y-0.5 border-l pl-3"
                    style={{ borderColor: `${colorSecundario}40` }}
                  >
                    {item.children.map(child => {
                      const active    = isActiveChild(child.href)
                      const bloqueado = child.modulo && !modulos.includes(child.modulo)

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                          style={active
                            ? { backgroundColor: colorSecundario, color: '#ffffff' }
                            : bloqueado
                              ? { color: 'rgba(255,255,255,0.4)' }
                              : { color: 'rgba(255,255,255,0.6)' }
                          }
                          onMouseEnter={e => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = `${colorSecundario}40`
                              e.currentTarget.style.color = '#ffffff'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = bloqueado
                                ? 'rgba(255,255,255,0.4)'
                                : 'rgba(255,255,255,0.6)'
                            }
                          }}
                        >
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span className="flex-1">{child.label}</span>
                          {bloqueado && <Lock className="w-3 h-3 shrink-0 opacity-50" />}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Item normal
          const active    = isActive(item.href!)
          const bloqueado = item.modulo && !modulos.includes(item.modulo)
          const Icon      = item.icon

          return (
            <Link
              key={item.href}
              href={item.href!}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={active
                ? { backgroundColor: colorSecundario, color: '#ffffff' }
                : bloqueado
                  ? { color: 'rgba(255,255,255,0.4)' }
                  : { color: 'rgba(255,255,255,0.7)' }
              }
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = `${colorSecundario}40`
                  e.currentTarget.style.color = '#ffffff'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = bloqueado
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.7)'
                }
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {bloqueado
                ? <Lock className="w-3 h-3 shrink-0 opacity-50" />
                : active
                  ? <ChevronRight className="w-3 h-3 shrink-0" />
                  : null
              }
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: `${colorSecundario}60` }}
      >
        <p className="text-xs text-white/40 text-center">Sistema de Gestión</p>
      </div>
    </aside>
  )
}