/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.rol === 'OPERADOR') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const desde    = searchParams.get('desde')    || ''
  const hasta    = searchParams.get('hasta')    || ''
  const modulo   = searchParams.get('modulo')   || ''
  const accion   = searchParams.get('accion')   || ''
  const usuarioId = searchParams.get('usuarioId') || ''

  const registros = await prisma.auditoria.findMany({
    where: {
      empresaId,
      ...(desde && hasta && {
        createdAt: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
      ...(modulo    && { modulo }),
      ...(accion    && { accion }),
      ...(usuarioId && { usuarioId }),
    },
    include: {
      usuario: { select: { nombre: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json(registros)
}