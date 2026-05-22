/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { TrendingUp, ShoppingCart, BarChart3, CreditCard, Wallet, Package, Shield } from 'lucide-react'

const REPORTES_BASE = [
  {
    href:        '/reportes/ventas',
    icon:        TrendingUp,
    titulo:      'Ventas por período',
    descripcion: 'Listado de ventas con totales, IVA y estado de cobro.',
    color:       'text-blue-600',
    bg:          'bg-blue-50',
  },
  {
    href:        '/reportes/compras',
    icon:        ShoppingCart,
    titulo:      'Compras por período',
    descripcion: 'Listado de compras con totales, IVA y estado de pago.',
    color:       'text-purple-600',
    bg:          'bg-purple-50',
  },
  {
    href:        '/reportes/resultado',
    icon:        BarChart3,
    titulo:      'Resultado por período',
    descripcion: 'Comparativo ventas vs compras con ganancia o pérdida.',
    color:       'text-green-600',
    bg:          'bg-green-50',
  },
  {
    href:        '/reportes/cuentas-cobrar',
    icon:        Wallet,
    titulo:      'Cuentas por cobrar',
    descripcion: 'Ventas pendientes de cobro ordenadas por vencimiento.',
    color:       'text-orange-600',
    bg:          'bg-orange-50',
  },
  {
    href:        '/reportes/cuentas-pagar',
    icon:        CreditCard,
    titulo:      'Cuentas por pagar',
    descripcion: 'Compras pendientes de pago ordenadas por vencimiento.',
    color:       'text-red-600',
    bg:          'bg-red-50',
  },
  {
    href:        '/reportes/inventario',
    icon:        Package,
    titulo:      'Inventario valorizado',
    descripcion: 'Stock actual valorizado a precio de compra promedio.',
    color:       'text-teal-600',
    bg:          'bg-teal-50',
  },
]

const REPORTE_AUDITORIA = {
  href:        '/reportes/auditoria',
  icon:        Shield,
  titulo:      'Auditoría',
  descripcion: 'Historial completo de acciones realizadas en el sistema.',
  color:       'text-gray-600',
  bg:          'bg-gray-100',
}

export default function ReportesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const colorPrimario = user?.colorPrimario || '#1E3A5F'

  // Auditoría solo para ADMIN y SUPERADMIN
  const reportes = user?.rol !== 'OPERADOR'
    ? [...REPORTES_BASE, REPORTE_AUDITORIA]
    : REPORTES_BASE

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Informes y análisis del negocio</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {reportes.map(({ href, icon: Icon, titulo, descripcion, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">{titulo}</h2>
            <p className="text-xs text-gray-500">{descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}