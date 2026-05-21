/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.rol !== 'SUPERADMIN') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { empresaId } = await req.json()

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, colorPrimario: true, colorSecundario: true, logoUrl: true }
  })

  if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  const res = NextResponse.json({ empresa })

  // Guardar en cookie del servidor
  res.cookies.set('superadmin_empresa_id', empresaId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 8, // 8 horas
    path:     '/',
  })

  return res
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('superadmin_empresa_id')
  return res
}