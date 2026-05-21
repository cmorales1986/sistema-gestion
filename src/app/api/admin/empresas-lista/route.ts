/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.rol !== 'SUPERADMIN') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const empresas = await prisma.empresa.findMany({
    include: {
      usuarios: { where: { rol: 'ADMIN' }, take: 1, select: { nombre: true, email: true } },
      plan:     { select: { nombre: true, precio: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(empresas)
}