import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const pago = await prisma.pagoCompra.findUnique({
    where: { id },
    include: { compra: true }
  })

  if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.pagoCompra.delete({ where: { id } })

    const nuevoMontoPagado = pago.compra.montoPagado - pago.monto
    const nuevoSaldo       = pago.compra.total - nuevoMontoPagado
    const estadoPago       = nuevoMontoPagado <= 0 ? 'PENDIENTE' : nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL'

    await tx.compra.update({
      where: { id: pago.compraId },
      data: { montoPagado: Math.max(0, nuevoMontoPagado), estadoPago }
    })
  })

  return NextResponse.json({ ok: true })
}