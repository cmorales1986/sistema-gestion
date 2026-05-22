/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, MODULOS, ACCIONES } from "@/lib/auditoria";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const empresaId = (session.user as any).empresaId;

  const articulo = await prisma.articulo.update({
    where: { id },
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      unidadMedida: body.unidadMedida || "unidad",
      inventariable: body.inventariable ?? true,
      stockMinimo: parseFloat(body.stockMinimo) || 0,
      precioCompra: body.precioCompra ? parseFloat(body.precioCompra) : null,
      precioVenta: body.precioVenta ? parseFloat(body.precioVenta) : null,
      impuestoId: body.impuestoId || null,
      categoriaId: body.categoriaId || null,
    },
    include: {
      categoria: { select: { nombre: true } },
      impuesto: { select: { nombre: true, porcentaje: true } },
    },
  });

  await registrarAuditoria({
    empresaId,
    usuarioId: (session.user as any).id,
    modulo: MODULOS.ARTICULOS,
    accion: ACCIONES.CREAR,
    descripcion: `Nuevo artículo ${articulo.nombre} — ${articulo.codigo}`,
    metadata: {
      articuloId: articulo.id,
      nombre: articulo.nombre,
      codigo: articulo.codigo,
    },
  });

  return NextResponse.json(articulo);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.articulo.update({ where: { id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
