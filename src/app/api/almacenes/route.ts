/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const almacenes = await prisma.almacen.findMany({
    where: { empresaId, activo: true },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(almacenes)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const almacen = await prisma.almacen.create({
    data: { nombre: body.nombre, descripcion: body.descripcion || null, empresaId }
  })

  return NextResponse.json(almacen, { status: 201 })
}