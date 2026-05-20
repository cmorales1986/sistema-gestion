/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const { searchParams } = new URL(req.url)
  const proveedorId = searchParams.get('proveedorId') || ''

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      estado:     'CONFIRMADA',
      estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
      ...(proveedorId && { proveedorId }),
    },
    include: {
      proveedor:     { select: { nombre: true, telefono: true, email: true } },
      condicionPago: { select: { nombre: true } },
    },
    orderBy: { fechaVencimiento: 'asc' },
  })

  const total = compras.reduce((a, c) => a + (c.total - c.montoPagado), 0)

  return NextResponse.json({ compras, total })
}