/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validarPeriodo } from "@/lib/periodo";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q") || "";

  const ventas = await prisma.venta.findMany({
    where: {
      empresaId,
      ...(busqueda && {
        cliente: { nombre: { contains: busqueda, mode: "insensitive" } },
      }),
    },
    include: {
      cliente: { select: { nombre: true } },
      condicionPago: { select: { nombre: true } },  // ← agregar esto
      detalles: { select: { total: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(ventas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = (session.user as any).empresaId;
  const body = await req.json();

  const {
    clienteId,
    fecha,
    nroComprobante,
    tipoComprobante,
    condicionPagoId,
    monedaId,
    tipoCambio,
    descuento,
    observacion,
    almacenId,
    detalles,
    estado,
  } = body;

  if (!clienteId || !fecha || !detalles?.length) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Validar período contable solo si se confirma
  if (estado === "CONFIRMADA") {
    const errorPeriodo = await validarPeriodo(empresaId, fecha);
    if (errorPeriodo) {
      return NextResponse.json({ error: errorPeriodo }, { status: 422 });
    }
  }

  // Calcular totales
  let subtotal = 0;
  let totalIva5 = 0;
  let totalIva10 = 0;

  const detallesCalculados = detalles.map((d: any) => {
    const subtotalItem =
      d.cantidad * d.precioUnitario * (1 - (d.descuento || 0) / 100);
    const pct = d.porcentajeIva || 0;
    if (pct === 5) {
      totalIva5 += subtotalItem / 21;
    }
    if (pct === 10) {
      totalIva10 += subtotalItem / 11;
    }
    subtotal += subtotalItem;
    return {
      articuloId: d.articuloId,
      impuestoId: d.impuestoId || null,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      descuento: d.descuento || 0,
      subtotal: subtotalItem,
      total: subtotalItem,
    };
  });

  const descuentoMonto = subtotal * ((descuento || 0) / 100);
  const total = subtotal - descuentoMonto;

  const condicion = condicionPagoId
    ? await prisma.condicionPago.findUnique({ where: { id: condicionPagoId } })
    : null;

  const fechaVencimiento =
    condicion && condicion.dias > 0
      ? new Date(
          new Date(fecha).getTime() + condicion.dias * 24 * 60 * 60 * 1000,
        )
      : null;

  const venta = await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.create({
      data: {
        nroComprobante,
        tipoComprobante: tipoComprobante || "FACTURA",
        fecha: new Date(fecha),
        condicionPagoId: condicionPagoId || null,
        fechaVencimiento,
        monedaId: monedaId || null,
        tipoCambio: tipoCambio || 1,
        subtotal,
        descuento: descuentoMonto,
        totalIva5,
        totalIva10,
        total,
        estadoPago: condicion?.dias === 0 ? "PAGADO" : "PENDIENTE",
        montoPagado: condicion?.dias === 0 ? total : 0,
        estado: estado || "CONFIRMADA",
        observacion: observacion || null,
        clienteId,
        empresaId,
        detalles: { create: detallesCalculados },
      },
      include: { detalles: true },
    });

    // Descontar stock si está confirmada
    if (estado === "CONFIRMADA" && almacenId) {
      for (const d of detallesCalculados) {
        const articulo = await tx.articulo.findUnique({
          where: { id: d.articuloId },
          select: { inventariable: true },
        });
        if (!articulo?.inventariable) continue;

        await tx.stock.upsert({
          where: {
            articuloId_almacenId: { articuloId: d.articuloId, almacenId },
          },
          create: {
            articuloId: d.articuloId,
            almacenId,
            cantidad: -d.cantidad,
          },
          update: { cantidad: { decrement: d.cantidad } },
        });
      }
    }

    if (estado === "CONFIRMADA" && body.timbradoId) {
      await tx.timbrado.update({
        where: { id: body.timbradoId },
        data: { siguiente: { increment: 1 } },
      });
    }

    return venta;
  });

  return NextResponse.json(venta, { status: 201 });
}
