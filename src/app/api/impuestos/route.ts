/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const impuestos = await prisma.impuesto.findMany({
    where: { empresaId, activo: true },
    orderBy: { porcentaje: 'asc' },
  })

  return NextResponse.json(impuestos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const impuesto = await prisma.impuesto.create({
    data: {
      nombre:     body.nombre,
      porcentaje: parseFloat(body.porcentaje) || 0,
      empresaId,
    }
  })

  return NextResponse.json(impuesto, { status: 201 })
}