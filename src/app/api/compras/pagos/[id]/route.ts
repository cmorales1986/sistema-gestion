// src/app/api/compras/pagos/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'
import { registrarAuditoria, MODULOS, ACCIONES } from '@/lib/auditoria'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id }    = await params
  const empresaId = await getEmpresaId(session)
  const usuarioId = (session.user as any).id

  const pago = await prisma.pagoCompra.findUnique({
    where: { id },
    include: { compra: true }
  })

  if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Verificar que el movimiento bancario asociado no esté conciliado
  const movBancario = await prisma.movimientoBancario.findFirst({
    where: { referenciaId: id, referenciaTipo: 'PAGO_COMPRA' }
  })
  if (movBancario?.estado === 'CONCILIADO') {
    return NextResponse.json(
      { error: 'No se puede eliminar un pago que ya fue conciliado con el banco' },
      { status: 400 }
    )
  }

  await prisma.$transaction(async (tx) => {
    // Revertir monto en la compra
    const nuevoMontoPagado = Math.max(0, pago.compra.montoPagado - pago.monto)
    const nuevoSaldo       = pago.compra.total - nuevoMontoPagado
    const estadoPago       = nuevoMontoPagado <= 0 ? 'PENDIENTE' : nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL'

    await tx.compra.update({
      where: { id: pago.compraId },
      data: { montoPagado: nuevoMontoPagado, estadoPago }
    })

    // Revertir movimiento de caja si existe
    const movimientoCaja = await tx.movimientoCaja.findFirst({
      where: { referenciaId: id }
    })
    if (movimientoCaja) {
      await tx.movimientoCaja.delete({ where: { id: movimientoCaja.id } })
    }

    // Revertir movimiento bancario PENDIENTE si existe
    if (movBancario) {
      await tx.movimientoBancario.delete({ where: { id: movBancario.id } })
    }

    await tx.pagoCompra.delete({ where: { id } })
  })

  await registrarAuditoria({
    empresaId,
    usuarioId,
    modulo:      MODULOS.PAGOS,
    accion:      ACCIONES.ELIMINAR,
    descripcion: `Eliminación pago de Gs. ${pago.monto} — compra ${pago.compra.nroComprobante || pago.compraId}`,
    metadata: {
      pagoId:   id,
      compraId: pago.compraId,
      monto:    pago.monto,
    }
  })

  return NextResponse.json({ ok: true })
}