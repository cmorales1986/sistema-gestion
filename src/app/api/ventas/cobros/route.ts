/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresaId } from "@/lib/get-empresa-id";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde") || "";
  const hasta = searchParams.get("hasta") || "";
  const clienteId = searchParams.get("clienteId") || "";
  const medioPago = searchParams.get("medioPago") || "";

  const cobros = await prisma.pagoVenta.findMany({
    where: {
      empresaId,
      ...(desde &&
        hasta && {
          fecha: {
            gte: new Date(desde),
            lte: new Date(hasta + "T23:59:59"),
          },
        }),
      ...(medioPago && { medioPago: medioPago as any }),
      ...(clienteId && {
        venta: { clienteId },
      }),
    },
    include: {
      venta: {
        select: {
          nroComprobante: true,
          cliente: { select: { nombre: true } },
        },
      },
    },
    orderBy: { fecha: "desc" },
  });

  const total = cobros.reduce((a, c) => a + c.monto, 0);
  return NextResponse.json({ cobros, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const body = await req.json();
  const monto = parseFloat(body.monto);

  if (!monto || monto <= 0)
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });

  const venta = await prisma.venta.findUnique({ where: { id: body.ventaId } });
  if (!venta)
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  if (venta.estado === "ANULADA")
    return NextResponse.json(
      { error: "La venta está anulada" },
      { status: 400 },
    );

  const saldo = venta.total - venta.montoPagado;
  if (monto > saldo)
    return NextResponse.json(
      { error: `El monto supera el saldo de Gs. ${saldo}` },
      { status: 400 },
    );

  const resultado = await prisma.$transaction(async (tx) => {
    const cobro = await tx.pagoVenta.create({
      data: {
        fecha: new Date(body.fecha),
        monto,
        medioPago: body.medioPago || "EFECTIVO",
        nroReferencia: body.nroReferencia || null,
        observacion: body.observacion || null,
        ventaId: body.ventaId,
        empresaId,
      },
    });

    const nuevoMontoPagado = venta.montoPagado + monto;
    const nuevoSaldo = venta.total - nuevoMontoPagado;
    const estadoPago = nuevoSaldo <= 0 ? "PAGADO" : "PARCIAL";

    await tx.venta.update({
      where: { id: body.ventaId },
      data: { montoPagado: nuevoMontoPagado, estadoPago },
    });

    if (body.medioPago === "EFECTIVO") {
      const cajaAbierta = await tx.aperturaCaja.findFirst({
        where: { empresaId, estado: "ABIERTA" },
      });
      if (cajaAbierta) {
        await tx.movimientoCaja.create({
          data: {
            aperturaCajaId: cajaAbierta.id,
            empresaId,
            tipo: "ENTRADA",
            origen: "COBRO_VENTA",
            concepto: `Cobro factura ${venta.nroComprobante || body.ventaId}`,
            monto,
            referenciaId: cobro.id,
          },
        });
      }
    }

    await registrarAuditoria({
      empresaId,
      usuarioId: (session.user as any).id,
      modulo: MODULOS.COBROS,
      accion: ACCIONES.COBRO,
      descripcion: `Cobro de Gs. ${monto} — ${body.medioPago}`,
      metadata: {
        ventaId: body.ventaId,
        monto,
        medioPago: body.medioPago,
      },
    });

    return cobro;
  });

  return NextResponse.json(resultado, { status: 201 });
}
