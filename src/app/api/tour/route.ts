// src/app/api/tour/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioId = (session.user as any).id

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { tourCompletado: true },
  })

  return NextResponse.json({ tourCompletado: usuario?.tourCompletado ?? false })
}

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioId = (session.user as any).id

  await prisma.usuario.update({
    where: { id: usuarioId },
    data:  { tourCompletado: true },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioId = (session.user as any).id

  // Resetear el tour (para el botón de ayuda "Ver tour de nuevo")
  await prisma.usuario.update({
    where: { id: usuarioId },
    data:  { tourCompletado: false },
  })

  return NextResponse.json({ ok: true })
}