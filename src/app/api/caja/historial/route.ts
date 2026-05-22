import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde') || ''
  const hasta = searchParams.get('hasta') || ''

  const aperturas = await prisma.aperturaCaja.findMany({
    where: {
      empresaId,
      estado: 'CERRADA',
      ...(desde && hasta && {
        fechaApertura: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
    },
    include: {
      caja:            { select: { nombre: true } },
      usuarioApertura: { select: { nombre: true } },
      usuarioCierre:   { select: { nombre: true } },
      movimientos:     true,
    },
    orderBy: { fechaApertura: 'desc' },
  })

  return NextResponse.json(aperturas)
}