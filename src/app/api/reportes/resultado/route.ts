/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde') || ''
  const hasta = searchParams.get('hasta') || ''

  const filtroFecha = desde && hasta ? {
    fecha: {
      gte: new Date(desde),
      lte: new Date(hasta + 'T23:59:59'),
    }
  } : {}

  const [ventasAgg, comprasAgg, ventasPorDia, comprasPorDia] = await Promise.all([
    prisma.venta.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', ...filtroFecha },
      _sum: { total: true, totalIva5: true, totalIva10: true },
      _count: true,
    }),
    prisma.compra.aggregate({
      where: { empresaId, estado: 'CONFIRMADA', ...filtroFecha },
      _sum: { total: true, totalIva5: true, totalIva10: true },
      _count: true,
    }),
    prisma.venta.groupBy({
      by: ['fecha'],
      where: { empresaId, estado: 'CONFIRMADA', ...filtroFecha },
      _sum: { total: true },
      orderBy: { fecha: 'asc' },
    }),
    prisma.compra.groupBy({
      by: ['fecha'],
      where: { empresaId, estado: 'CONFIRMADA', ...filtroFecha },
      _sum: { total: true },
      orderBy: { fecha: 'asc' },
    }),
  ])

  const totalVentas  = ventasAgg._sum.total  || 0
  const totalCompras = comprasAgg._sum.total || 0
  const resultado    = totalVentas - totalCompras

  return NextResponse.json({
    ventas:  { total: totalVentas,  count: ventasAgg._count,  iva5: ventasAgg._sum.totalIva5  || 0, iva10: ventasAgg._sum.totalIva10  || 0 },
    compras: { total: totalCompras, count: comprasAgg._count, iva5: comprasAgg._sum.totalIva5 || 0, iva10: comprasAgg._sum.totalIva10 || 0 },
    resultado,
    ventasPorDia,
    comprasPorDia,
  })
}