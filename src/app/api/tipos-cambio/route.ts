/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  const fecha = new Date(body.fecha)
  fecha.setHours(0, 0, 0, 0)

  const tipoCambio = await prisma.tipoCambio.upsert({
    where: { monedaId_fecha: { monedaId: body.monedaId, fecha } },
    update: { valor: parseFloat(body.valor) },
    create: {
      monedaId:  body.monedaId,
      fecha,
      valor:     parseFloat(body.valor),
      empresaId,
    }
  })

  return NextResponse.json(tipoCambio, { status: 201 })
}