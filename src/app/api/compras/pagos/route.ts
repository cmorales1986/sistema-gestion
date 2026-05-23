// src/app/api/compras/pagos/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'
import { registrarAuditoria, MODULOS, ACCIONES } from '@/lib/auditoria'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const desde       = searchParams.get('desde')       || ''
  const hasta       = searchParams.get('hasta')        || ''
  const proveedorId = searchParams.get('proveedorId')  || ''
  const medioPago   = searchParams.get('medioPago')    || ''

  const pagos = await prisma.pagoCompra.findMany({
    where: {
      empresaId,
      ...(desde && hasta && {
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        }
      }),
      ...(medioPago   && { medioPago: medioPago as any }),
      ...(proveedorId && { compra: { proveedorId } }),
    },
    include: {
      compra: {
        select: {
          nroComprobante: true,
          proveedor: { select: { nombre: true } },
        }
      },
    },
    orderBy: { fecha: 'desc' },
  })

  const total = pagos.reduce((a, p) => a + p.monto, 0)
  return NextResponse.json({ pagos, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const usuarioId = (session.user as any).id
  const body      = await req.json()
  const monto     = parseFloat(body.monto)

  if (!monto || monto <= 0)
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const compra = await prisma.compra.findUnique({ where: { id: body.compraId } })
  if (!compra)
    return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
  if (compra.estado === 'ANULADA')
    return NextResponse.json({ error: 'La compra está anulada' }, { status: 400 })

  const saldo = compra.total - compra.montoPagado
  if (monto > saldo)
    return NextResponse.json({ error: `El monto supera el saldo de Gs. ${saldo}` }, { status: 400 })

  // Crear movimiento bancario solo si viene cuentaBancariaId (plan Pro)
  // Para plan Básico simplemente no se envía y se omite sin error
  const crearMovBancario = ['CHEQUE', 'TRANSFERENCIA'].includes(body.medioPago)
    && !!body.cuentaBancariaId

  const resultado = await prisma.$transaction(async (tx) => {
    const pago = await tx.pagoCompra.create({
      data: {
        fecha:         new Date(body.fecha),
        monto,
        medioPago:     body.medioPago     || 'EFECTIVO',
        nroReferencia: body.nroReferencia || null,
        observacion:   body.observacion   || null,
        compraId:      body.compraId,
        empresaId,
      }
    })

    const nuevoMontoPagado = compra.montoPagado + monto
    const nuevoSaldo       = compra.total - nuevoMontoPagado
    const estadoPago       = nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL'

    await tx.compra.update({
      where: { id: body.compraId },
      data: { montoPagado: nuevoMontoPagado, estadoPago }
    })

    // ── EFECTIVO → movimiento de caja ────────────────────────────
    if (body.medioPago === 'EFECTIVO') {
      const cajaAbierta = await tx.aperturaCaja.findFirst({
        where: { empresaId, estado: 'ABIERTA' }
      })
      if (cajaAbierta) {
        await tx.movimientoCaja.create({
          data: {
            aperturaCajaId: cajaAbierta.id,
            empresaId,
            tipo:           'SALIDA',
            origen:         'PAGO_COMPRA',
            concepto:       `Pago factura ${compra.nroComprobante || body.compraId}`,
            monto,
            referenciaId:   pago.id,
          }
        })
      }
    }

    // ── CHEQUE o TRANSFERENCIA + cuenta bancaria → movimiento PENDIENTE (solo Pro) ──
    if (crearMovBancario) {
      const concepto = body.medioPago === 'CHEQUE'
        ? `Cheque ${body.nroReferencia ? '#' + body.nroReferencia + ' — ' : ''}Pago factura ${compra.nroComprobante || body.compraId}`
        : `Transferencia${body.nroReferencia ? ' ' + body.nroReferencia : ''} — Pago factura ${compra.nroComprobante || body.compraId}`

      await tx.movimientoBancario.create({
        data: {
          cuentaId:       body.cuentaBancariaId,
          empresaId,
          tipo:           'DEBITO',
          concepto,
          monto,
          fecha:          new Date(body.fecha),
          estado:         'PENDIENTE',
          referenciaTipo: 'PAGO_COMPRA',
          referenciaId:   pago.id,
        }
      })
    }

    return pago
  })

  await registrarAuditoria({
    empresaId,
    usuarioId,
    modulo:      MODULOS.PAGOS,
    accion:      ACCIONES.PAGO,
    descripcion: `Pago de Gs. ${monto} — ${body.medioPago} — compra ${compra.nroComprobante || body.compraId}`,
    metadata: {
      pagoId:           resultado.id,
      compraId:         body.compraId,
      monto,
      medioPago:        body.medioPago,
      nroReferencia:    body.nroReferencia    || null,
      cuentaBancariaId: body.cuentaBancariaId || null,
    }
  })

  return NextResponse.json(resultado, { status: 201 })
}