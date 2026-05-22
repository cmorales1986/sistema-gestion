/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEmpresaId } from "@/lib/get-empresa-id";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";
import { verificarLimite } from "@/lib/verificar-limite";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q") || "";

  const proveedores = await prisma.proveedor.findMany({
    where: {
      empresaId,
      activo: true,
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: "insensitive" } },
          { ruc: { contains: busqueda, mode: "insensitive" } },
          { telefono: { contains: busqueda, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(proveedores);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const empresaId = await getEmpresaId(session);
  const body = await req.json();

  const limiteCheck = await verificarLimite({
    empresaId,
    tipo: "proveedores",
    limites: (session.user as any).limites,
  });
  if (!limiteCheck.ok) {
    return NextResponse.json({ error: limiteCheck.mensaje }, { status: 403 });
  }

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: body.nombre,
      ruc: body.ruc || null,
      telefono: body.telefono || null,
      email: body.email || null,
      direccion: body.direccion || null,
      empresaId,
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: (session.user as any).id,
    modulo: MODULOS.PROVEEDORES,
    accion: ACCIONES.CREAR,
    descripcion: `Nuevo proveedor ${body.nombre}`,
    metadata: {
      proveedorId: proveedor.id,
      nombre: proveedor.nombre,
      ruc: proveedor.ruc,
    },
  });

  return NextResponse.json(proveedor, { status: 201 });
}
