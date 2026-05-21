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
  const busqueda = searchParams.get('q') || ''

  const articulos = await prisma.articulo.findMany({
    where: {
      empresaId,
      activo: true,
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { codigo: { contains: busqueda, mode: 'insensitive' } },
        ]
      })
    },
    include: {
      categoria:  { select: { nombre: true } },
      impuesto:   { select: { nombre: true, porcentaje: true } },
      stock:      { include: { almacen: { select: { nombre: true } } } },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(articulos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const total = await prisma.articulo.count({ where: { empresaId } })
  const codigoAuto = `ART-${String(total + 1).padStart(4, '0')}`

  const articulo = await prisma.articulo.create({
    data: {
      codigo:        codigoAuto,
      nombre:        body.nombre,
      descripcion:   body.descripcion  || null,
      unidadMedida:  body.unidadMedida || 'unidad',
      inventariable: body.inventariable ?? true,
      stockMinimo:   parseFloat(body.stockMinimo) || 0,
      precioCompra:  body.precioCompra  ? parseFloat(body.precioCompra) : null,
      precioVenta:   body.precioVenta   ? parseFloat(body.precioVenta)  : null,
      impuestoId:    body.impuestoId    || null,
      categoriaId:   body.categoriaId   || null,
      empresaId,
    },
    include: {
      categoria: { select: { nombre: true } },
      impuesto:  { select: { nombre: true, porcentaje: true } },
    },
  })

  return NextResponse.json(articulo, { status: 201 })
}