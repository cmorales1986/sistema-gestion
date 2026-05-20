import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      condicionPago: true,
      moneda: true,
      detalles: {
        include: {
          articulo: { select: { nombre: true, codigo: true, unidadMedida: true } },
          impuesto: { select: { nombre: true, porcentaje: true } },
        }
      },
    }
  })

  if (!venta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(venta)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const venta = await prisma.venta.findUnique({
    where: { id },
    include: { detalles: true }
  })

  if (!venta) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (venta.estado === 'ANULADA') return NextResponse.json({ error: 'Ya está anulada' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    // Revertir stock si estaba confirmada
    if (venta.estado === 'CONFIRMADA') {
      for (const d of venta.detalles) {
        const articulo = await tx.articulo.findUnique({
          where: { id: d.articuloId },
          select: { inventariable: true }
        })
        if (!articulo?.inventariable) continue

        const stocks = await tx.stock.findMany({ where: { articuloId: d.articuloId } })
        for (const stock of stocks) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { cantidad: { increment: d.cantidad } }
          })
        }
      }
    }

    await tx.venta.update({
      where: { id },
      data: { estado: 'ANULADA', estadoPago: 'PENDIENTE', montoPagado: 0 }
    })
  })

  return NextResponse.json({ ok: true })
}