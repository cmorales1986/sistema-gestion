import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const movimiento = await prisma.movimientoCaja.findUnique({ where: { id } })
  if (!movimiento) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (movimiento.origen !== 'MANUAL') {
    return NextResponse.json({ error: 'Solo se pueden eliminar movimientos manuales' }, { status: 400 })
  }

  await prisma.movimientoCaja.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}