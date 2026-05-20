/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId

  const stock = await prisma.stock.findMany({
    where: {
      articulo: { empresaId, inventariable: true, activo: true },
      cantidad: { gt: 0 },
    },
    include: {
      articulo: {
        select: {
          codigo: true, nombre: true, unidadMedida: true,
          stockMinimo: true, precioCompra: true, precioVenta: true,
          categoria: { select: { nombre: true } },
        }
      },
      almacen: { select: { nombre: true } },
    },
    orderBy: { articulo: { nombre: 'asc' } },
  })

  const valorTotal = stock.reduce((a, s) => a + (s.cantidad * (s.articulo.precioCompra || 0)), 0)

  return NextResponse.json({ stock, valorTotal })
}