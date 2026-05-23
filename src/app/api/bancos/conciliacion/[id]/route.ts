// src/app/api/bancos/conciliacion/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id } = await params

  const conciliacion = await prisma.conciliacionBancaria.findFirst({
    where: { id, empresaId },
    include: {
      cuenta: {
        select: {
          nroCuenta: true,
          saldoInicial: true,
          banco: { select: { nombre: true, codigo: true } },
          moneda: { select: { codigo: true, simbolo: true } },
        },
      },
      movimientos: {
        orderBy: { fecha: 'asc' },
        include: {
          cheque: { select: { nroCheque: true, tipo: true } },
        },
      },
      ajustes: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!conciliacion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(conciliacion)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id } = await params

  const conciliacion = await prisma.conciliacionBancaria.findFirst({
    where: { id, empresaId },
  })
  if (!conciliacion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (conciliacion.estado === 'CERRADA') {
    return NextResponse.json({ error: 'No se puede eliminar una conciliación cerrada' }, { status: 400 })
  }

  // Desvincular movimientos antes de eliminar
  await prisma.movimientoBancario.updateMany({
    where: { conciliacionId: id },
    data: { conciliacionId: null, estado: 'PENDIENTE' },
  })

  await prisma.conciliacionBancaria.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}