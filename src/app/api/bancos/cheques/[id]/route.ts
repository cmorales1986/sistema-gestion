import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body   = await req.json()

  const cheque = await prisma.cheque.update({
    where: { id },
    data:  { estado: body.estado, observacion: body.observacion || undefined }
  })

  return NextResponse.json(cheque)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.cheque.update({ where: { id }, data: { estado: 'ANULADO' } })
  return NextResponse.json({ ok: true })
}