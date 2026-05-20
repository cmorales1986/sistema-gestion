/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const { searchParams } = new URL(req.url)
  const busqueda = searchParams.get('q') || ''

  const proveedores = await prisma.proveedor.findMany({
    where: {
      empresaId,
      activo: true,
      ...(busqueda && {
        OR: [
          { nombre:   { contains: busqueda, mode: 'insensitive' } },
          { ruc:      { contains: busqueda, mode: 'insensitive' } },
          { telefono: { contains: busqueda, mode: 'insensitive' } },
        ]
      })
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(proveedores)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const body = await req.json()

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre:    body.nombre,
      ruc:       body.ruc       || null,
      telefono:  body.telefono  || null,
      email:     body.email     || null,
      direccion: body.direccion || null,
      empresaId,
    }
  })

  return NextResponse.json(proveedor, { status: 201 })
}