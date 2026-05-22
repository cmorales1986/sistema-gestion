import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const cuentas = await prisma.cuentaBancaria.findMany({
    where: { empresaId, activo: true },
    include: {
      banco:  { select: { nombre: true, codigo: true } },
      moneda: { select: { codigo: true, simbolo: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calcular saldo actual de cada cuenta
  const cuentasConSaldo = await Promise.all(cuentas.map(async c => {
    const movimientos = await prisma.movimientoBancario.findMany({
      where: { cuentaId: c.id }
    })
    const creditos = movimientos.filter(m => m.tipo === 'CREDITO').reduce((a, m) => a + m.monto, 0)
    const debitos  = movimientos.filter(m => m.tipo === 'DEBITO').reduce((a, m) => a + m.monto, 0)
    const saldoActual = c.saldoInicial + creditos - debitos

    return { ...c, saldoActual }
  }))

  return NextResponse.json(cuentasConSaldo)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body      = await req.json()

  if (!body.bancoId)   return NextResponse.json({ error: 'El banco es requerido' }, { status: 400 })
  if (!body.nroCuenta) return NextResponse.json({ error: 'El número de cuenta es requerido' }, { status: 400 })

  const cuenta = await prisma.cuentaBancaria.create({
    data: {
      bancoId:      body.bancoId,
      nroCuenta:    body.nroCuenta,
      descripcion:  body.descripcion  || null,
      monedaId:     body.monedaId     || null,
      saldoInicial: parseFloat(body.saldoInicial) || 0,
      empresaId,
    },
    include: {
      banco:  { select: { nombre: true, codigo: true } },
      moneda: { select: { codigo: true, simbolo: true } },
    }
  })

  return NextResponse.json(cuenta, { status: 201 })
}