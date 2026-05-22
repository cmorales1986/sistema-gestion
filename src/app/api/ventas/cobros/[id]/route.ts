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

  const cobro = await prisma.pagoVenta.findUnique({
    where: { id },
    include: { venta: true }
  })

  if (!cobro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    // Revertir monto en la venta
    const nuevoMontoPagado = Math.max(0, cobro.venta.montoPagado - cobro.monto)
    const nuevoSaldo       = cobro.venta.total - nuevoMontoPagado
    const estadoPago       = nuevoMontoPagado <= 0 ? 'PENDIENTE' : nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL'

    await tx.venta.update({
      where: { id: cobro.ventaId },
      data: { montoPagado: nuevoMontoPagado, estadoPago }
    })

    // Revertir movimiento en caja si existe
    const movimientoCaja = await tx.movimientoCaja.findFirst({
      where: { referenciaId: id }
    })
    if (movimientoCaja) {
      await tx.movimientoCaja.delete({ where: { id: movimientoCaja.id } })
    }

    // Eliminar el cobro
    await tx.pagoVenta.delete({ where: { id } })
  })

  await registrarAuditoria({
    empresaId,
    usuarioId,
    modulo:      MODULOS.COBROS,
    accion:      ACCIONES.ELIMINAR,
    descripcion: `Eliminación cobro de Gs. ${cobro.monto} — venta ${cobro.venta.nroComprobante || cobro.ventaId}`,
    metadata: {
      cobroId: id,
      ventaId: cobro.ventaId,
      monto:   cobro.monto,
    }
  })

  return NextResponse.json({ ok: true })
}