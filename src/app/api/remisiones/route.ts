// src/app/api/remisiones/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'
import { registrarAuditoria, MODULOS, ACCIONES } from '@/lib/auditoria'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { searchParams } = new URL(req.url)
  const tipo   = searchParams.get('tipo')  || ''
  const estado = searchParams.get('estado') || ''
  const desde  = searchParams.get('desde') || ''
  const hasta  = searchParams.get('hasta') || ''

  const remisiones = await prisma.remision.findMany({
    where: {
      empresaId,
      ...(tipo   && { tipo:   tipo   as any }),
      ...(estado && { estado: estado as any }),
      ...(desde && hasta && {
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta + 'T23:59:59'),
        },
      }),
    },
    include: {
      almacenOrigen:  { select: { nombre: true } },
      almacenDestino: { select: { nombre: true } },
      _count: { select: { detalles: true } },
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(remisiones)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const usuarioId = (session.user as any).id
  const usuarioNombre = (session.user as any).name || ''
  const body = await req.json()

  // Validaciones básicas
  if (!body.tipo)  return NextResponse.json({ error: 'El tipo es requerido' }, { status: 400 })
  if (!body.fecha) return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 })
  if (!body.detalles?.length) return NextResponse.json({ error: 'Agregá al menos un artículo' }, { status: 400 })

  if (body.tipo === 'ENTRADA' && !body.almacenDestinoId)
    return NextResponse.json({ error: 'Seleccioná el almacén de destino' }, { status: 400 })
  if (body.tipo === 'SALIDA' && !body.almacenOrigenId)
    return NextResponse.json({ error: 'Seleccioná el almacén de origen' }, { status: 400 })
  if (body.tipo === 'TRANSFERENCIA' && (!body.almacenOrigenId || !body.almacenDestinoId))
    return NextResponse.json({ error: 'Seleccioná el almacén origen y destino' }, { status: 400 })
  if (body.tipo === 'TRANSFERENCIA' && body.almacenOrigenId === body.almacenDestinoId)
    return NextResponse.json({ error: 'El almacén origen y destino no pueden ser el mismo' }, { status: 400 })

  // Generar número interno
  const count = await prisma.remision.count({ where: { empresaId } })
  const numero = `REM-${String(count + 1).padStart(5, '0')}`

  const estado = body.estado || 'BORRADOR'

  const remision = await prisma.$transaction(async (tx) => {
    const nueva = await tx.remision.create({
      data: {
        numero,
        tipo:            body.tipo,
        esFiscal:        body.esFiscal        || false,
        nroComprobante:  body.nroComprobante  || null,
        timbradoNro:     body.timbradoNro     || null,
        serie1:          body.serie1          || null,
        serie2:          body.serie2          || null,
        fecha:           new Date(body.fecha),
        motivoEntrada:   body.motivoEntrada   || null,
        motivoSalida:    body.motivoSalida    || null,
        observacion:     body.observacion     || null,
        estado,
        almacenOrigenId:  body.almacenOrigenId  || null,
        almacenDestinoId: body.almacenDestinoId || null,
        creadoPor:        usuarioNombre,
        empresaId,
        detalles: {
          create: body.detalles.map((d: any) => ({
            articuloId:  d.articuloId,
            cantidad:    parseFloat(d.cantidad),
            precioUnit:  d.precioUnit ? parseFloat(d.precioUnit) : null,
            observacion: d.observacion || null,
          })),
        },
      },
    })

    // Si se confirma, mover el stock
    if (estado === 'CONFIRMADA') {
      await moverStock(tx, nueva.id, body)
    }

    return nueva
  })

  await registrarAuditoria({
    empresaId,
    usuarioId,
    modulo:      MODULOS.STOCK || 'STOCK',
    accion:      ACCIONES.CREAR || 'CREAR',
    descripcion: `Remisión ${numero} — ${body.tipo} — ${estado}`,
    metadata:    { remisionId: remision.id, tipo: body.tipo, estado },
  })

  return NextResponse.json(remision, { status: 201 })
}

// ── Función auxiliar para mover stock ────────────────────────────────────────
export async function moverStock(tx: any, remisionId: string, body: any) {
  const detalles = body.detalles as any[]

  for (const d of detalles) {
    const cantidad = parseFloat(d.cantidad)

    if (body.tipo === 'ENTRADA') {
      // Sumar stock en almacén destino
      await upsertStock(tx, d.articuloId, body.almacenDestinoId, +cantidad)
    }

    if (body.tipo === 'SALIDA') {
      // Restar stock en almacén origen
      await upsertStock(tx, d.articuloId, body.almacenOrigenId, -cantidad)
    }

    if (body.tipo === 'TRANSFERENCIA') {
      // Restar en origen, sumar en destino
      await upsertStock(tx, d.articuloId, body.almacenOrigenId,  -cantidad)
      await upsertStock(tx, d.articuloId, body.almacenDestinoId, +cantidad)
    }
  }
}

async function upsertStock(tx: any, articuloId: string, almacenId: string, delta: number) {
  const existente = await tx.stock.findUnique({
    where: { articuloId_almacenId: { articuloId, almacenId } },
  })

  if (existente) {
    await tx.stock.update({
      where: { articuloId_almacenId: { articuloId, almacenId } },
      data:  { cantidad: { increment: delta } },
    })
  } else {
    await tx.stock.create({
      data: { articuloId, almacenId, cantidad: delta },
    })
  }
}