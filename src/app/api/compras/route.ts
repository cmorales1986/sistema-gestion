/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { validarPeriodo } from '@/lib/periodo'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const { searchParams } = new URL(req.url)
  const busqueda = searchParams.get('q') || ''

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      ...(busqueda && {
        proveedor: { nombre: { contains: busqueda, mode: 'insensitive' } }
      })
    },
    include: {
      proveedor: { select: { nombre: true } },
      detalles:  { select: { total: true } },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(compras)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const body = await req.json()

  const {
    proveedorId, fecha, nroComprobante, tipoComprobante,
    condicionPagoId, monedaId, tipoCambio,
    descuento, observacion, almacenId, detalles, estado,
  } = body

  if (!proveedorId || !fecha || !detalles?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Validar período contable solo si se confirma (no borrador)
  if (estado === 'CONFIRMADA') {
    const errorPeriodo = await validarPeriodo(empresaId, fecha)
    if (errorPeriodo) {
      return NextResponse.json({ error: errorPeriodo }, { status: 422 })
    }
  }

  // Calcular totales
  let subtotal   = 0
  let totalIva5  = 0
  let totalIva10 = 0

  const detallesCalculados = detalles.map((d: any) => {
    const subtotalItem = d.cantidad * d.precioUnitario * (1 - (d.descuento || 0) / 100)
    let ivaItem = 0

    if (d.impuestoId) {
      // El porcentaje viene del impuesto seleccionado
      const pct = d.porcentajeIva || 0
      if (pct === 5)  { ivaItem = subtotalItem / 21;  totalIva5  += ivaItem }
      if (pct === 10) { ivaItem = subtotalItem / 11;  totalIva10 += ivaItem }
    }

    subtotal += subtotalItem

    return {
      articuloId:     d.articuloId,
      impuestoId:     d.impuestoId || null,
      cantidad:       d.cantidad,
      precioUnitario: d.precioUnitario,
      descuento:      d.descuento || 0,
      subtotal:       subtotalItem,
      total:          subtotalItem,
    }
  })

  const descuentoMonto = subtotal * ((descuento || 0) / 100)
  const total = subtotal - descuentoMonto

  // Fecha vencimiento si es crédito
  const condicion = condicionPagoId
    ? await prisma.condicionPago.findUnique({ where: { id: condicionPagoId } })
    : null

  const fechaVencimiento = condicion && condicion.dias > 0
    ? new Date(new Date(fecha).getTime() + condicion.dias * 24 * 60 * 60 * 1000)
    : null

  const compra = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        nroComprobante,
        tipoComprobante: tipoComprobante || 'FACTURA',
        fecha:           new Date(fecha),
        condicionPagoId: condicionPagoId || null,
        fechaVencimiento,
        monedaId:        monedaId        || null,
        tipoCambio:      tipoCambio      || 1,
        subtotal,
        descuento:       descuentoMonto,
        totalIva5,
        totalIva10,
        total,
        estadoPago:      condicion?.dias === 0 ? 'PAGADO' : 'PENDIENTE',
        montoPagado:     condicion?.dias === 0 ? total : 0,
        estado:          estado || 'CONFIRMADA',
        observacion:     observacion || null,
        proveedorId,
        empresaId,
        detalles: { create: detallesCalculados }
      },
      include: { detalles: true }
    })

    // Actualizar stock y precio promedio ponderado solo si está confirmada
    if (estado === 'CONFIRMADA' && almacenId) {
      for (const d of detallesCalculados) {
        const stockActual = await tx.stock.findUnique({
          where: { articuloId_almacenId: { articuloId: d.articuloId, almacenId } }
        })

        const cantidadActual = stockActual?.cantidad || 0

        await tx.stock.upsert({
          where: { articuloId_almacenId: { articuloId: d.articuloId, almacenId } },
          create: { articuloId: d.articuloId, almacenId, cantidad: d.cantidad },
          update: { cantidad: { increment: d.cantidad } }
        })

        const articulo = await tx.articulo.findUnique({
          where: { id: d.articuloId },
          select: { precioCompra: true, inventariable: true }
        })

        if (articulo?.inventariable) {
          const precioActual = articulo.precioCompra || d.precioUnitario
          const nuevoPrecio  = (cantidadActual * precioActual + d.cantidad * d.precioUnitario) / (cantidadActual + d.cantidad)
          await tx.articulo.update({
            where: { id: d.articuloId },
            data:  { precioCompra: nuevoPrecio }
          })
        }
      }
    }

    return compra
  })

  return NextResponse.json(compra, { status: 201 })
}