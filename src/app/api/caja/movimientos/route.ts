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

  const empresaId = (session.user as any).empresaId;
  const { searchParams } = new URL(req.url);
  const aperturaCajaId = searchParams.get("aperturaCajaId") || "";

  const movimientos = await prisma.movimientoCaja.findMany({
    where: {
      empresaId,
      ...(aperturaCajaId && { aperturaCajaId }),
    },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(movimientos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const body = await req.json();

  // Verificar que hay caja abierta
  const apertura = await prisma.aperturaCaja.findFirst({
    where: { empresaId, estado: "ABIERTA" },
  });
  if (!apertura)
    return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 });

  const movimiento = await prisma.movimientoCaja.create({
    data: {
      aperturaCajaId: apertura.id,
      empresaId,
      tipo: body.tipo,
      origen: "MANUAL",
      concepto: body.concepto,
      monto: parseFloat(body.monto),
      fecha: new Date(),
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: (session.user as any).id,
    modulo: MODULOS.CAJA,
    accion: body.tipo === "ENTRADA" ? ACCIONES.COBRO : ACCIONES.PAGO,
    descripcion: `Movimiento manual ${body.tipo} — ${body.concepto} — Gs. ${body.monto}`,
    metadata: {
      movimientoId: movimiento.id,
      tipo: body.tipo,
      concepto: body.concepto,
      monto: body.monto,
    },
  });

  return NextResponse.json(movimiento, { status: 201 });
}
