// src/app/api/bancos/conciliacion/[id]/ajustes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id }    = await params
  const body      = await req.json()

  const conciliacion = await prisma.conciliacionBancaria.findFirst({
    where: { id, empresaId },
  })
  if (!conciliacion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (conciliacion.estado === 'CERRADA') {
    return NextResponse.json({ error: 'No se pueden agregar ajustes a una conciliación cerrada' }, { status: 400 })
  }

  if (!body.descripcion) return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 })
  if (!body.monto)       return NextResponse.json({ error: 'El monto es requerido' }, { status: 400 })
  if (!body.tipo)        return NextResponse.json({ error: 'El tipo es requerido' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioNombre = (session.user as any)?.name || (session.user as any)?.email || 'Usuario'

  const ajuste = await prisma.ajusteConciliacion.create({
    data: {
      conciliacionId: id,
      tipo:           body.tipo,
      descripcion:    body.descripcion,
      monto:          parseFloat(body.monto),
      fecha:          new Date(body.fecha || new Date()),
      creadoPor:      usuarioNombre,
    },
  })

  // Recalcular diferencia
  const todosAjustes = await prisma.ajusteConciliacion.findMany({
    where: { conciliacionId: id },
  })
  const totalAjustes = todosAjustes.reduce((a, aj) => a + aj.monto, 0)
  const diferencia   = conciliacion.saldoExtracto - (conciliacion.saldoLibros + totalAjustes)

  await prisma.conciliacionBancaria.update({
    where: { id },
    data:  { diferencia },
  })

  return NextResponse.json(ajuste, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id }    = await params
  const { searchParams } = new URL(req.url)
  const ajusteId  = searchParams.get('ajusteId')

  if (!ajusteId) return NextResponse.json({ error: 'ajusteId requerido' }, { status: 400 })

  const conciliacion = await prisma.conciliacionBancaria.findFirst({
    where: { id, empresaId },
  })
  if (!conciliacion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (conciliacion.estado === 'CERRADA') {
    return NextResponse.json({ error: 'No se pueden eliminar ajustes de una conciliación cerrada' }, { status: 400 })
  }

  await prisma.ajusteConciliacion.delete({ where: { id: ajusteId } })

  // Recalcular diferencia
  const todosAjustes = await prisma.ajusteConciliacion.findMany({
    where: { conciliacionId: id },
  })
  const totalAjustes = todosAjustes.reduce((a, aj) => a + aj.monto, 0)
  const diferencia   = conciliacion.saldoExtracto - (conciliacion.saldoLibros + totalAjustes)

  await prisma.conciliacionBancaria.update({
    where: { id },
    data:  { diferencia },
  })

  return NextResponse.json({ ok: true })
}