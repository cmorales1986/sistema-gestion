/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const monedas = await prisma.moneda.findMany({
    where: { empresaId, activo: true },
    include: {
      tiposCambio: {
        orderBy: { fecha: 'desc' },
        take: 1,
      }
    },
    orderBy: { principal: 'desc' },
  })

  return NextResponse.json(monedas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  // Si es principal, quitarle el flag a las demás
  if (body.principal) {
    await prisma.moneda.updateMany({
      where: { empresaId },
      data: { principal: false }
    })
  }

  const moneda = await prisma.moneda.create({
    data: {
      codigo:    body.codigo.toUpperCase(),
      nombre:    body.nombre,
      simbolo:   body.simbolo,
      principal: body.principal ?? false,
      empresaId,
    }
  })

  return NextResponse.json(moneda, { status: 201 })
}