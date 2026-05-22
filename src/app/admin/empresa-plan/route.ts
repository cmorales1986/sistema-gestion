/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.rol !== 'SUPERADMIN') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const empresaId = searchParams.get('empresaId')

  if (!empresaId) return NextResponse.json({ error: 'empresaId requerido' }, { status: 400 })

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { plan: { select: { modulos: true, reportes: true, nombre: true } } }
  })

  if (!empresa) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json({
    modulos:    empresa.plan?.modulos  || [],
    reportes:   empresa.plan?.reportes || [],
    planNombre: empresa.plan?.nombre   || '',
  })
}