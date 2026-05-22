import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bancos = await prisma.banco.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(bancos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  if (!body.nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!body.codigo?.trim()) return NextResponse.json({ error: 'El código es requerido' }, { status: 400 })

  const banco = await prisma.banco.create({
    data: {
      nombre: body.nombre.trim().toUpperCase(),
      codigo: body.codigo.trim().toUpperCase(),
    }
  })

  return NextResponse.json(banco, { status: 201 })
}