// src/app/api/bancos/conciliacion/route.ts
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

  const conciliaciones = await prisma.conciliacionBancaria.findMany({
    where: {
      empresaId,
      ...(cuentaId && { cuentaId }),
    },
    include: {
      cuenta: {
        select: {
          nroCuenta: true,
          banco: { select: { nombre: true, codigo: true } },
        },
      },
      _count: {
        select: { movimientos: true, ajustes: true },
      },
    },
    orderBy: [{ periodo: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(conciliaciones)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body = await req.json()

  if (!body.cuentaId)    return NextResponse.json({ error: 'La cuenta es requerida' }, { status: 400 })
  if (!body.periodo)     return NextResponse.json({ error: 'El período es requerido' }, { status: 400 })
  if (!body.fechaDesde)  return NextResponse.json({ error: 'La fecha desde es requerida' }, { status: 400 })
  if (!body.fechaHasta)  return NextResponse.json({ error: 'La fecha hasta es requerida' }, { status: 400 })
  if (body.saldoExtracto === undefined) return NextResponse.json({ error: 'El saldo del extracto es requerido' }, { status: 400 })

  // Verificar que no exista ya para ese período/cuenta
  const existente = await prisma.conciliacionBancaria.findUnique({
    where: {
      empresaId_cuentaId_periodo: { empresaId, cuentaId: body.cuentaId, periodo: body.periodo },
    },
  })
  if (existente) {
    return NextResponse.json(
      { error: `Ya existe una conciliación para ese período. Podés editarla desde la lista.` },
      { status: 409 }
    )
  }

  const fechaDesde = new Date(body.fechaDesde)
  const fechaHasta = new Date(body.fechaHasta + 'T23:59:59')

  // Calcular saldo según libros: saldoInicial + movimientos del período
  const cuenta = await prisma.cuentaBancaria.findUnique({
    where: { id: body.cuentaId },
    select: { saldoInicial: true },
  })
  if (!cuenta) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  // Todos los movimientos hasta la fecha de fin (para saldo acumulado)
  const todosMovimientos = await prisma.movimientoBancario.findMany({
    where: {
      cuentaId: body.cuentaId,
      fecha: { lte: fechaHasta },
    },
  })
  const creditos = todosMovimientos.filter(m => m.tipo === 'CREDITO').reduce((a, m) => a + m.monto, 0)
  const debitos  = todosMovimientos.filter(m => m.tipo === 'DEBITO').reduce((a, m) => a + m.monto, 0)
  const saldoLibros = cuenta.saldoInicial + creditos - debitos

  const diferencia = parseFloat(body.saldoExtracto) - saldoLibros

  // Vincular movimientos del período a esta conciliación
  const movimientosPeriodo = await prisma.movimientoBancario.findMany({
    where: {
      cuentaId: body.cuentaId,
      fecha: { gte: fechaDesde, lte: fechaHasta },
      conciliacionId: null, // solo los que no están en otra conciliación
    },
    select: { id: true },
  })

  const conciliacion = await prisma.conciliacionBancaria.create({
    data: {
      empresaId,
      cuentaId:     body.cuentaId,
      periodo:      body.periodo,
      fechaDesde,
      fechaHasta,
      saldoExtracto: parseFloat(body.saldoExtracto),
      saldoLibros,
      diferencia,
      notas:        body.notas || null,
      movimientos: {
        connect: movimientosPeriodo.map(m => ({ id: m.id })),
      },
    },
    include: {
      cuenta: {
        select: {
          nroCuenta: true,
          banco: { select: { nombre: true, codigo: true } },
        },
      },
      movimientos: {
        orderBy: { fecha: 'asc' },
        include: {
          cheque: { select: { nroCheque: true } },
        },
      },
      ajustes: true,
      _count: { select: { movimientos: true } },
    },
  })

  return NextResponse.json(conciliacion, { status: 201 })
}