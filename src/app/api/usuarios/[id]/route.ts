/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: any = {
    nombre: body.nombre,
    email:  body.email,
    rol:    body.rol,
  }

  if (body.password) {
    data.password = await bcrypt.hash(body.password, 10)
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true }
  })

  return NextResponse.json(usuario)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const sesionUserId = (session.user as any).id

  if (id === sesionUserId) {
    return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 })
  }

  await prisma.usuario.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}