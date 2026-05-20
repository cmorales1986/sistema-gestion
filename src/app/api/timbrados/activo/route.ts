/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const hoy = new Date()

  const timbrado = await prisma.timbrado.findFirst({
    where: {
      empresaId,
      activo: true,
      fechaInicio:      { lte: hoy },
      fechaVencimiento: { gte: hoy },
    }
  })

  if (!timbrado) return NextResponse.json({ timbrado: null })

  // Verificar si quedó sin números
  if (timbrado.siguiente > timbrado.hasta) {
    return NextResponse.json({ timbrado: null, error: 'Timbrado sin números disponibles' })
  }

  // Generar el número formateado
  const nroFormateado = `${timbrado.serie1}-${timbrado.serie2}-${String(timbrado.siguiente).padStart(7, '0')}`

  return NextResponse.json({ timbrado, nroFormateado })
}