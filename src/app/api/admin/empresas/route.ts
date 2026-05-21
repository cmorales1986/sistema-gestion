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
    where: { estado: { not: 'SUSPENDIDO' } },
    select: {
      id:     true,
      nombre: true,
      estado: true,
      slug:   true,
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(empresas)
}