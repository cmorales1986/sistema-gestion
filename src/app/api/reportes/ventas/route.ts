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
  const desde    = searchParams.get('desde')    || ''
  const hasta    = searchParams.get('hasta')    || ''
  const clienteId = searchParams.get('clienteId') || ''

  const ventas = await prisma.venta.findMany({
    where: {
      empresaId,
      estado: 'CONFIRMADA',
      ...(desde && hasta && {
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
      ...(clienteId && { clienteId }),
    },
    include: {
      cliente:       { select: { nombre: true } },
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

  const totalGeneral  = ventas.reduce((a, v) => a + v.total, 0)
  const totalIva5     = ventas.reduce((a, v) => a + v.totalIva5, 0)
  const totalIva10    = ventas.reduce((a, v) => a + v.totalIva10, 0)
  const totalCobrado  = ventas.reduce((a, v) => a + v.montoPagado, 0)
  const totalPendiente = ventas.reduce((a, v) => a + (v.total - v.montoPagado), 0)

  return NextResponse.json({ ventas, totalGeneral, totalIva5, totalIva10, totalCobrado, totalPendiente })
}