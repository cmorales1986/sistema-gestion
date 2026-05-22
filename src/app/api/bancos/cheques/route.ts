/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const movimiento = searchParams.get('movimiento') || ''
  const estado     = searchParams.get('estado')     || ''
  const desde      = searchParams.get('desde')      || ''
  const hasta      = searchParams.get('hasta')      || ''

  const cheques = await prisma.cheque.findMany({
    where: {
      empresaId,
      ...(movimiento && { movimiento }),
      ...(estado     && { estado: estado as any }),
      ...(desde && hasta && {
        fechaPago: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
    },
    include: {
      banco: { select: { nombre: true, codigo: true } },
    },
    orderBy: { fechaPago: 'asc' },
  })

  return NextResponse.json(cheques)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body      = await req.json()

  const fechaEmision = new Date(body.fechaEmision)
  const fechaPago    = new Date(body.fechaPago)
  const diasDiferido = Math.ceil((fechaPago.getTime() - fechaEmision.getTime()) / (1000 * 60 * 60 * 24))
  const tipo         = diasDiferido > 0 ? 'DIFERIDO' : 'COMUN'

  const cheque = await prisma.cheque.create({
    data: {
      tipo,
      movimiento:   body.movimiento,
      nroCheque:    body.nroCheque,
      bancoId:      body.bancoId    || null,
      bancoNombre:  body.bancoNombre || null,
      monto:        parseFloat(body.monto),
      fechaEmision,
      fechaPago,
      diasDiferido,
      estado:       body.movimiento === 'EMITIDO' ? 'ENTREGADO' : 'EN_CARTERA',
      beneficiario: body.beneficiario || null,
      emisor:       body.emisor       || null,
      observacion:  body.observacion  || null,
      pagoCompraId: body.pagoCompraId || null,
      pagoVentaId:  body.pagoVentaId  || null,
      empresaId,
    },
    include: {
      banco: { select: { nombre: true, codigo: true } },
    }
  })

  return NextResponse.json(cheque, { status: 201 })
}