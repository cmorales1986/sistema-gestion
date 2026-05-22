 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      condicionPago: true,
      moneda: true,
      detalles: {
        include: {
          articulo: {
            select: { nombre: true, codigo: true, unidadMedida: true },
          },
          impuesto: { select: { nombre: true, porcentaje: true } },
        },
      },
    },
  });

  if (!compra)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(compra);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const compra = await prisma.compra.update({
    where: { id },
    data: {
      estado: body.estado,
      estadoPago: body.estadoPago,
      montoPagado: body.montoPagado,
    },
  });

  return NextResponse.json(compra);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  ) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const empresaId = await getEmpresaId(session);
  const usuarioId = (session.user as any).id;

  // Obtener la compra con sus detalles
  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      detalles: {
        include: {
          articulo: { select: { inventariable: true, precioCompra: true } },
        },
      },
    },
  });

  if (!compra)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (compra.estado === "ANULADA")
    return NextResponse.json({ error: "Ya está anulada" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    // Revertir stock y precio promedio ponderado
    if (compra.estado === "CONFIRMADA") {
      for (const d of compra.detalles) {
        if (!d.articulo.inventariable) continue;

        // Buscar en qué almacén se registró el stock de esta compra
        // Como una compra puede tener un solo almacén buscamos por artículo
        const stocks = await tx.stock.findMany({
          where: { articuloId: d.articuloId },
        });

        for (const stock of stocks) {
          const nuevaCantidad = Math.max(0, stock.cantidad - d.cantidad);

          await tx.stock.update({
            where: { id: stock.id },
            data: { cantidad: nuevaCantidad },
          });
        }

        // Revertir precio promedio ponderado
        // stockActual ya descontado, precioActual del artículo
        const articulo = await tx.articulo.findUnique({
          where: { id: d.articuloId },
          select: { precioCompra: true },
        });

        if (articulo?.precioCompra && d.cantidad > 0) {
          // Obtener stock total actual ya descontado
          const stocksActualizados = await tx.stock.findMany({
            where: { articuloId: d.articuloId },
          });
          const stockTotal = stocksActualizados.reduce(
            (a, s) => a + s.cantidad,
            0,
          );

          if (stockTotal > 0) {
            // Recalcular precio inverso
            const precioRevertido =
              (articulo.precioCompra * (stockTotal + d.cantidad) -
                d.precioUnitario * d.cantidad) /
              stockTotal;

            await tx.articulo.update({
              where: { id: d.articuloId },
              data: { precioCompra: Math.max(0, precioRevertido) },
            });
          }
        }
      }
    }

    // Anular la compra
    await tx.compra.update({
      where: { id },
      data: {
        estado: "ANULADA",
        estadoPago: "PENDIENTE",
        montoPagado: 0,
      },
    });
  });

  await registrarAuditoria({
  empresaId,
  usuarioId,
  modulo:      MODULOS.COMPRAS,
  accion:      ACCIONES.ANULAR,
  descripcion: `Anulación compra ${compra.nroComprobante || id} — Gs. ${compra.total}`,
  metadata: {
    compraId:       id,
    nroComprobante: compra.nroComprobante,
    total:          compra.total,
  }
})

  return NextResponse.json({ ok: true });
}
