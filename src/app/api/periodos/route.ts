/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const periodos = await prisma.periodoContable.findMany({
    where: { empresaId },
    orderBy: { fechaInicio: 'desc' },
  })

  return NextResponse.json(periodos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  // Verificar que no se solape con otro período
  const solapado = await prisma.periodoContable.findFirst({
    where: {
      empresaId,
      OR: [
        {
          fechaInicio: { lte: new Date(body.fechaFin) },
          fechaFin:    { gte: new Date(body.fechaInicio) },
        }
      ]
    }
  })

  if (solapado) {
    return NextResponse.json(
      { error: 'El período se solapa con uno existente' },
      { status: 400 }
    )
  }

  const periodo = await prisma.periodoContable.create({
    data: {
      nombre:      body.nombre,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin:    new Date(body.fechaFin),
      estado:      'ABIERTO',
      empresaId,
    }
  })

  return NextResponse.json(periodo, { status: 201 })
}