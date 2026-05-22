/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresaId } from "@/lib/get-empresa-id";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";

// GET — obtener apertura activa
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const empresaId = await getEmpresaId(session);

  const apertura = await prisma.aperturaCaja.findFirst({
    where: { empresaId, estado: "ABIERTA" },
    include: {
      caja: { select: { nombre: true } },
      usuarioApertura: { select: { nombre: true } },
      movimientos: {
        orderBy: { fecha: "desc" },
      },
    },
    orderBy: { fechaApertura: "desc" },
  });

  if (!apertura) return NextResponse.json({ apertura: null });

  // Calcular saldo actual
  const entradas = apertura.movimientos
    .filter((m) => m.tipo === "ENTRADA")
    .reduce((a, m) => a + m.monto, 0);
  const salidas = apertura.movimientos
    .filter((m) => m.tipo === "SALIDA")
    .reduce((a, m) => a + m.monto, 0);
  const saldoActual = apertura.saldoInicial + entradas - salidas;

  return NextResponse.json({ apertura, saldoActual, entradas, salidas });
}

// POST — abrir caja
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const usuarioId = (session.user as any).id;
  const body = await req.json();

  // Verificar que no haya caja abierta
  const cajaAbierta = await prisma.aperturaCaja.findFirst({
    where: { empresaId, estado: "ABIERTA" },
  });
  if (cajaAbierta)
    return NextResponse.json(
      { error: "Ya hay una caja abierta" },
      { status: 400 },
    );

  const apertura = await prisma.aperturaCaja.create({
    data: {
      cajaId: body.cajaId,
      empresaId,
      saldoInicial: parseFloat(body.saldoInicial) || 0,
      estado: "ABIERTA",
      usuarioAperturaId: usuarioId,
    },
    include: {
      caja: { select: { nombre: true } },
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: (session.user as any).id,
    modulo: MODULOS.CAJA,
    accion: ACCIONES.APERTURA_CAJA,
    descripcion: `Apertura de caja con saldo inicial Gs. ${body.saldoInicial || 0}`,
    metadata: {
      cajaId: body.cajaId,
      saldoInicial: body.saldoInicial,
    },
  });

  return NextResponse.json(apertura, { status: 201 });
}
