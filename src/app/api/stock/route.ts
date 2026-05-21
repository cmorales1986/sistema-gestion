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
  const busqueda   = searchParams.get('q')         || ''
  const almacenId  = searchParams.get('almacenId') || ''

  const stock = await prisma.stock.findMany({
    where: {
      articulo: {
        empresaId,
        activo: true,
        inventariable: true,
        ...(busqueda && {
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { codigo: { contains: busqueda, mode: 'insensitive' } },
          ]
        })
      },
      ...(almacenId && { almacenId }),
    },
    include: {
      articulo: {
        select: {
          id: true, codigo: true, nombre: true,
          unidadMedida: true, stockMinimo: true,
          precioCompra: true, precioVenta: true,
          categoria: { select: { nombre: true } },
        }
      },
      almacen: { select: { id: true, nombre: true } },
    },
    orderBy: { articulo: { nombre: 'asc' } },
  })

  return NextResponse.json(stock)
}