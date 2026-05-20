/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId

  const condiciones = await prisma.condicionPago.findMany({
    where: { empresaId, activo: true },
    orderBy: { dias: 'asc' },
  })

  return NextResponse.json(condiciones)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const body = await req.json()

  const condicion = await prisma.condicionPago.create({
    data: {
      nombre:    body.nombre,
      dias:      parseInt(body.dias) || 0,
      empresaId,
    }
  })

  return NextResponse.json(condicion, { status: 201 })
}