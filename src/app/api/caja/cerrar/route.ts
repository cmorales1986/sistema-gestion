/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresaId } from "@/lib/get-empresa-id";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const usuarioId = (session.user as any).id;
  const body = await req.json();

  const apertura = await prisma.aperturaCaja.findFirst({
    where: { empresaId, estado: "ABIERTA" },
    include: { movimientos: true },
  });

  if (!apertura)
    return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 });

  const entradas = apertura.movimientos
    .filter((m) => m.tipo === "ENTRADA")
    .reduce((a, m) => a + m.monto, 0);
  const salidas = apertura.movimientos
    .filter((m) => m.tipo === "SALIDA")
    .reduce((a, m) => a + m.monto, 0);
  const saldoFinal = apertura.saldoInicial + entradas - salidas;
  const saldoReal = parseFloat(body.saldoReal);
  const diferencia = saldoReal - saldoFinal;

  const cerrada = await prisma.aperturaCaja.update({
    where: { id: apertura.id },
    data: {
      estado: "CERRADA",
      fechaCierre: new Date(),
      saldoFinal,
      saldoReal,
      diferencia,
      observacionCierre: body.observacion || null,
      usuarioCierreId: usuarioId,
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: (session.user as any).id,
    modulo: MODULOS.CAJA,
    accion: ACCIONES.CIERRE_CAJA,
    descripcion: `Cierre de caja — Saldo real: Gs. ${saldoReal} — Diferencia: Gs. ${diferencia}`,
    metadata: {
      saldoInicial: apertura.saldoInicial,
      saldoFinal,
      saldoReal,
      diferencia,
    },
  });

  return NextResponse.json(cerrada);
}
