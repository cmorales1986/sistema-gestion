import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const cuentaId = searchParams.get('cuentaId') || ''
  const desde    = searchParams.get('desde')    || ''
  const hasta    = searchParams.get('hasta')    || ''

  const movimientos = await prisma.movimientoBancario.findMany({
    where: {
      empresaId,
      ...(cuentaId && { cuentaId }),
      ...(desde && hasta && {
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
    },
    include: {
      cuenta: {
        select: {
          nroCuenta: true,
          banco: { select: { nombre: true } }
        }
      },
      cheque: { select: { nroCheque: true, tipo: true } },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(movimientos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body      = await req.json()

  const movimiento = await prisma.movimientoBancario.create({
    data: {
      cuentaId:      body.cuentaId,
      tipo:          body.tipo,
      concepto:      body.concepto,
      monto:         parseFloat(body.monto),
      fecha:         new Date(body.fecha),
      referenciaTipo: body.referenciaTipo || 'MANUAL',
      referenciaId:  body.referenciaId   || null,
      chequeId:      body.chequeId       || null,
      empresaId,
    }
  })

  return NextResponse.json(movimiento, { status: 201 })
}