/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId

  const timbrados = await prisma.timbrado.findMany({
    where: { empresaId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(timbrados)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const body = await req.json()

  // Si es activo, desactivar los demás
  if (body.activo) {
    await prisma.timbrado.updateMany({
      where: { empresaId },
      data: { activo: false }
    })
  }

  const timbrado = await prisma.timbrado.create({
    data: {
      numero:           body.numero,
      serie1:           body.serie1.padStart(3, '0'),
      serie2:           body.serie2.padStart(3, '0'),
      desde:            parseInt(body.desde),
      hasta:            parseInt(body.hasta),
      siguiente:        parseInt(body.desde),
      fechaInicio:      new Date(body.fechaInicio),
      fechaVencimiento: new Date(body.fechaVencimiento),
      activo:           body.activo ?? true,
      empresaId,
    }
  })

  return NextResponse.json(timbrado, { status: 201 })
}