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

  if (body.principal) {
    await prisma.moneda.updateMany({
      where: { empresaId },
      data: { principal: false }
    })
  }

  const moneda = await prisma.moneda.update({
    where: { id },
    data: {
      codigo:    body.codigo.toUpperCase(),
      nombre:    body.nombre,
      simbolo:   body.simbolo,
      principal: body.principal ?? false,
    }
  })

  return NextResponse.json(moneda)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.moneda.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}