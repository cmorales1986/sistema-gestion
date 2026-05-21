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

  const categorias = await prisma.categoria.findMany({
    where: {
      empresaId,
      activo: true,
      ...(busqueda && {
        nombre: { contains: busqueda, mode: 'insensitive' }
      })
    },
    include: { _count: { select: { articulos: true } } },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const categoria = await prisma.categoria.create({
    data: { nombre: body.nombre, empresaId }
  })

  return NextResponse.json(categoria, { status: 201 })
}