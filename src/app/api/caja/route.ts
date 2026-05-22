import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const empresaId = await getEmpresaId(session)

  const cajas = await prisma.caja.findMany({
    where: { empresaId, activo: true },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(cajas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  if (!body.nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const caja = await prisma.caja.create({
    data: {
      nombre:      body.nombre.trim(),
      descripcion: body.descripcion || null,
      empresaId,
    }
  })

  return NextResponse.json(caja, { status: 201 })
}