'use client'

import { usePlan } from '@/lib/use-plan'
import ModuloBloqueado from '@/components/modulo-bloqueado'
import { Banknote } from 'lucide-react'

export default function BancosPage() {
  const { tieneModulo } = usePlan()

  if (!tieneModulo('BANCOS')) {
    return (
      <ModuloBloqueado
        modulo="Bancos"
        descripcion="Gestioná cuentas bancarias, cheques, depósitos y hacé conciliación bancaria automática."
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <Banknote className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Módulo de Bancos</h1>
      <p className="text-gray-500 text-sm">Próximamente disponible</p>
    </div>
  )
}