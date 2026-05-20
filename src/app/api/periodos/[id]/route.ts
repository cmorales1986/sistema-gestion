import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const periodo = await prisma.periodoContable.update({
    where: { id },
    data: {
      nombre:      body.nombre,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin:    new Date(body.fechaFin),
    }
  })

  return NextResponse.json(periodo)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const periodo = await prisma.periodoContable.update({
    where: { id },
    data: { estado: body.estado }
  })

  return NextResponse.json(periodo)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const periodo = await prisma.periodoContable.findUnique({ where: { id } })
  if (periodo?.estado === 'CERRADO') {
    return NextResponse.json({ error: 'No se puede eliminar un período cerrado' }, { status: 400 })
  }

  await prisma.periodoContable.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}