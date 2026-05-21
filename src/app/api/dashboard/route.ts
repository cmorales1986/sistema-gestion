 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const hoy       = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)

  const [
    comprasMes,
    ventasMes,
    comprasPendientes,
    ventasPendientes,
    stockItems,
    ultimasCompras,
    ultimasVentas,
  ] = await Promise.all([

    prisma.compra.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', fecha: { gte: inicioMes, lte: finMes } },
      _sum: { total: true },
      _count: true,
    }),

    prisma.venta.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', fecha: { gte: inicioMes, lte: finMes } },
      _sum: { total: true },
      _count: true,
    }),

    prisma.compra.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', estadoPago: { in: ['PENDIENTE', 'PARCIAL'] } },
      _sum: { total: true },
      _count: true,
    }),

    prisma.venta.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', estadoPago: { in: ['PENDIENTE', 'PARCIAL'] } },
      _sum: { total: true },
      _count: true,
    }),

    prisma.stock.findMany({
      where: { articulo: { empresaId, inventariable: true, activo: true } },
      include: { articulo: { select: { stockMinimo: true } } },
    }),

    prisma.compra.findMany({
      where: { empresaId, estado: { not: 'ANULADA' } },
      include: { proveedor: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    prisma.venta.findMany({
      where: { empresaId, estado: { not: 'ANULADA' } },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const stockBajoCount = stockItems.filter(
    s => s.articulo.stockMinimo > 0 && s.cantidad <= s.articulo.stockMinimo
  ).length

  return NextResponse.json({
    comprasMes:    { total: comprasMes._sum.total    || 0, count: comprasMes._count },
    ventasMes:     { total: ventasMes._sum.total     || 0, count: ventasMes._count },
    porPagar:      { total: comprasPendientes._sum.total || 0, count: comprasPendientes._count },
    porCobrar:     { total: ventasPendientes._sum.total  || 0, count: ventasPendientes._count },
    stockBajo:     stockBajoCount,
    ultimasCompras,
    ultimasVentas,
  })
}