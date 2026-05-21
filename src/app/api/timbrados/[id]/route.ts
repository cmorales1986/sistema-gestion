/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const empresaId = await getEmpresaId(session)

  if (body.activo) {
    await prisma.timbrado.updateMany({
      where: { empresaId, NOT: { id } },
      data: { activo: false }
    })
  }

  const timbrado = await prisma.timbrado.update({
    where: { id },
    data: {
      numero:           body.numero,
      serie1:           body.serie1.padStart(3, '0'),
      serie2:           body.serie2.padStart(3, '0'),
      desde:            parseInt(body.desde),
      hasta:            parseInt(body.hasta),
      fechaInicio:      new Date(body.fechaInicio),
      fechaVencimiento: new Date(body.fechaVencimiento),
      activo:           body.activo ?? false,
    }
  })

  return NextResponse.json(timbrado)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.timbrado.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}