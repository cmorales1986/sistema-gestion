/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function usePlan() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [modulosEmpresa, setModulosEmpresa] = useState<string[] | null>(null)
  const [reportesEmpresa, setReportesEmpresa] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Si es SUPERADMIN y tiene empresa seleccionada, cargar sus módulos
  useEffect(() => {
    if (user?.rol !== 'SUPERADMIN') return

    const empresaId = localStorage.getItem('superadmin_empresa_id')
    if (!empresaId) return

    setLoading(true)
    fetch(`/api/admin/empresa-plan?empresaId=${empresaId}`)
      .then(r => r.json())
      .then(data => {
        setModulosEmpresa(data.modulos  || [])
        setReportesEmpresa(data.reportes || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user?.rol])

  // Usar módulos de la empresa seleccionada si es SUPERADMIN
  const modulos  = modulosEmpresa  ?? (user?.modulos  || []) as string[]
  const reportes = reportesEmpresa ?? (user?.reportes || []) as string[]

  return {
    modulos,
    reportes,
    limites:    user?.limites    || {},
    planNombre: user?.planNombre || '',
    loading,

    tieneModulo:  (modulo: string)  => modulos.includes(modulo),
    tieneReporte: (reporte: string) => reportes.includes(reporte),
  }
}