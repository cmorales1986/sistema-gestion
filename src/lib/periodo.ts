import { prisma } from '@/lib/prisma'

export async function validarPeriodo(empresaId: string, fecha: string): Promise<string | null> {
  const fechaDoc = new Date(fecha)

  // Buscar período abierto que contenga la fecha
  const periodo = await prisma.periodoContable.findFirst({
    where: {
      empresaId,
      estado:      'ABIERTO',
      fechaInicio: { lte: fechaDoc },
      fechaFin:    { gte: fechaDoc },
    }
  })

  if (!periodo) {
    // Ver si existe algún período aunque sea cerrado para dar mejor mensaje
    const periodoExiste = await prisma.periodoContable.findFirst({
      where: {
        empresaId,
        fechaInicio: { lte: fechaDoc },
        fechaFin:    { gte: fechaDoc },
      }
    })

    if (periodoExiste) {
      return `El período "${periodoExiste.nombre}" está cerrado. Reabrilo en Parámetros → Períodos Contables.`
    }

    // Ver si hay períodos creados en general
    const hayPeriodos = await prisma.periodoContable.findFirst({
      where: { empresaId }
    })

    if (!hayPeriodos) {
      return 'No hay períodos contables configurados. Creá uno en Parámetros → Períodos Contables.'
    }

    return `No existe un período contable abierto para la fecha ${fechaDoc.toLocaleDateString('es-PY')}. Verificá en Parámetros → Períodos Contables.`
  }

  return null // null = válido
}