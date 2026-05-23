/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/remisiones/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'
import { moverStock } from '@/app/api/remisiones/route'
import { registrarAuditoria, MODULOS, ACCIONES } from '@/lib/auditoria'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id }    = await params

  const remision = await prisma.remision.findFirst({
    where: { id, empresaId },
    include: {
      almacenOrigen:  { select: { id: true, nombre: true } },
      almacenDestino: { select: { id: true, nombre: true } },
      detalles: {
        include: {
          articulo: {
            select: { id: true, codigo: true, nombre: true, unidadMedida: true, precioCompra: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!remision) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(remision)
}

// PATCH: confirmar o anular
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId    = await getEmpresaId(session)
  const usuarioId    = (session.user as any).id
  const usuarioNombre = (session.user as any).name || ''
  const { id }       = await params
  const body         = await req.json()

  const remision = await prisma.remision.findFirst({
    where: { id, empresaId },
    include: { detalles: true },
  })
  if (!remision) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  // ── CONFIRMAR ──
  if (body.accion === 'CONFIRMAR') {
    if (remision.estado !== 'BORRADOR')
      return NextResponse.json({ error: 'Solo se pueden confirmar borradores' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.remision.update({
        where: { id },
        data:  { estado: 'CONFIRMADA' },
      })
      // Mover stock
      await moverStock(tx, id, {
        tipo:             remision.tipo,
        almacenOrigenId:  remision.almacenOrigenId,
        almacenDestinoId: remision.almacenDestinoId,
        detalles:         remision.detalles.map(d => ({
          articuloId: d.articuloId,
          cantidad:   d.cantidad,
        })),
      })
    })

    await registrarAuditoria({
      empresaId, usuarioId,
      modulo:      'STOCK',
      accion:      'CONFIRMAR',
      descripcion: `Remisión ${remision.numero} confirmada por ${usuarioNombre}`,
      metadata:    { remisionId: id },
    })

    return NextResponse.json({ ok: true })
  }

  // ── ANULAR ──
  if (body.accion === 'ANULAR') {
    if (remision.estado === 'ANULADA')
      return NextResponse.json({ error: 'Ya está anulada' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.remision.update({
        where: { id },
        data:  {
          estado:          'ANULADA',
          anulacionMotivo: body.motivo || null,
          anulacionFecha:  new Date(),
        },
      })

      // Si estaba confirmada, revertir el stock (movimiento inverso)
      if (remision.estado === 'CONFIRMADA') {
        await moverStock(tx, id, {
          // Invertir el tipo para deshacer el movimiento
          tipo:             remision.tipo === 'ENTRADA'  ? 'SALIDA'
                          : remision.tipo === 'SALIDA'   ? 'ENTRADA'
                          : 'TRANSFERENCIA',
          // Para transferencia inversa: swap origen/destino
          almacenOrigenId:  remision.tipo === 'TRANSFERENCIA'
                              ? remision.almacenDestinoId
                              : remision.almacenOrigenId,
          almacenDestinoId: remision.tipo === 'TRANSFERENCIA'
                              ? remision.almacenOrigenId
                              : remision.almacenDestinoId,
          detalles: remision.detalles.map(d => ({
            articuloId: d.articuloId,
            cantidad:   d.cantidad,
          })),
        })
      }
    })

    await registrarAuditoria({
      empresaId, usuarioId,
      modulo:      'STOCK',
      accion:      'ANULAR',
      descripcion: `Remisión ${remision.numero} anulada`,
      metadata:    { remisionId: id, motivo: body.motivo },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id }    = await params

  const remision = await prisma.remision.findFirst({ where: { id, empresaId } })
  if (!remision) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (remision.estado === 'CONFIRMADA')
    return NextResponse.json({ error: 'No se puede eliminar una remisión confirmada. Primero anulala.' }, { status: 400 })

  await prisma.remision.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}