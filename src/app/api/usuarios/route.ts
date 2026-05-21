/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId, activo: true },
    select: {
      id: true, nombre: true, email: true, rol: true,
      activo: true, createdAt: true,
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const existe = await prisma.usuario.findUnique({ where: { email: body.email } })
  if (existe) return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })

  const usuario = await prisma.usuario.create({
    data: {
      nombre:   body.nombre,
      email:    body.email,
      password: await bcrypt.hash(body.password, 10),
      rol:      body.rol || 'OPERADOR',
      empresaId,
    },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true }
  })

  return NextResponse.json(usuario, { status: 201 })
}