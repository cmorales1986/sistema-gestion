/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const desde      = searchParams.get('desde')      || ''
  const hasta      = searchParams.get('hasta')      || ''
  const proveedorId = searchParams.get('proveedorId') || ''

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      estado: 'CONFIRMADA',
      ...(desde && hasta && {
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
      ...(proveedorId && { proveedorId }),
    },
    include: {
      proveedor:     { select: { nombre: true } },
      condicionPago: { select: { nombre: true } },
      moneda:        { select: { simbolo: true, codigo: true } },
      detalles: {
        include: {
          articulo: { select: { nombre: true, codigo: true } },
          impuesto: { select: { nombre: true, porcentaje: true } },
        }
      },
    },
    orderBy: { fecha: 'desc' },
  })

  const totalGeneral   = compras.reduce((a, c) => a + c.total, 0)
  const totalIva5      = compras.reduce((a, c) => a + c.totalIva5, 0)
  const totalIva10     = compras.reduce((a, c) => a + c.totalIva10, 0)
  const totalPagado    = compras.reduce((a, c) => a + c.montoPagado, 0)
  const totalPendiente = compras.reduce((a, c) => a + (c.total - c.montoPagado), 0)

  return NextResponse.json({ compras, totalGeneral, totalIva5, totalIva10, totalPagado, totalPendiente })
}