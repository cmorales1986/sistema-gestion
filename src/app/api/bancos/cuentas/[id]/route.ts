import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body   = await req.json()

  const cuenta = await prisma.cuentaBancaria.update({
    where: { id },
    data: {
      bancoId:      body.bancoId,
      nroCuenta:    body.nroCuenta,
      descripcion:  body.descripcion  || null,
      monedaId:     body.monedaId     || null,
      saldoInicial: parseFloat(body.saldoInicial) || 0,
    }
  })

  return NextResponse.json(cuenta)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.cuentaBancaria.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}