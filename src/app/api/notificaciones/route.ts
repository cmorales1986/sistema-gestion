/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const hoy = new Date()

  const [stockItems, comprasVencidas, ventasVencidas, timbrados, empresa] = await Promise.all([

    // Stock bajo
    prisma.stock.findMany({
      where: { articulo: { empresaId, inventariable: true, activo: true } },
      include: { articulo: { select: { nombre: true, stockMinimo: true, unidadMedida: true } } },
    }),

    // Compras vencidas sin pagar
    prisma.compra.findMany({
      where: {
        empresaId,
        estado:     'CONFIRMADA',
        estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
        fechaVencimiento: { lt: hoy },
      },
      include: { proveedor: { select: { nombre: true } } },
      orderBy: { fechaVencimiento: 'asc' },
      take: 5,
    }),

    // Ventas vencidas sin cobrar
    prisma.venta.findMany({
      where: {
        empresaId,
        estado:     'CONFIRMADA',
        estadoPago: { in: ['PENDIENTE', 'PARCIAL'] },
        fechaVencimiento: { lt: hoy },
      },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { fechaVencimiento: 'asc' },
      take: 5,
    }),

    // Timbrados por vencer
    prisma.timbrado.findMany({
      where: {
        empresaId,
        activo: true,
        fechaVencimiento: {
          gte: hoy,
          lte: new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000),
        }
      }
    }),

    // Estado del trial
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { estado: true, fechaVencimiento: true }
    }),
  ])

  const notificaciones = []

  // Stock bajo
  const articulosBajos = stockItems.filter(
    s => s.articulo.stockMinimo > 0 && s.cantidad <= s.articulo.stockMinimo
  )
  for (const s of articulosBajos) {
    notificaciones.push({
      id:     `stock-${s.id}`,
      tipo:   'STOCK',
      nivel:  'ERROR',
      titulo: 'Stock bajo',
      mensaje: `${s.articulo.nombre}: ${s.cantidad} ${s.articulo.unidadMedida} (mín: ${s.articulo.stockMinimo})`,
      href:   '/stock',
    })
  }

  // Compras vencidas
  for (const c of comprasVencidas) {
    const dias = Math.abs(Math.ceil((new Date(c.fechaVencimiento!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)))
    notificaciones.push({
      id:      `compra-${c.id}`,
      tipo:    'PAGO',
      nivel:   'WARNING',
      titulo:  'Pago vencido',
      mensaje: `${c.proveedor.nombre} — ${c.nroComprobante || 'Sin nro'} (${dias}d vencida)`,
      href:    `/compras/${c.id}`,
    })
  }

  // Ventas vencidas
  for (const v of ventasVencidas) {
    const dias = Math.abs(Math.ceil((new Date(v.fechaVencimiento!).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)))
    notificaciones.push({
      id:      `venta-${v.id}`,
      tipo:    'COBRO',
      nivel:   'WARNING',
      titulo:  'Cobro vencido',
      mensaje: `${v.cliente.nombre} — ${v.nroComprobante || 'Sin nro'} (${dias}d vencida)`,
      href:    `/ventas/${v.id}`,
    })
  }

  // Timbrado por vencer
  for (const t of timbrados) {
    const dias = Math.ceil((new Date(t.fechaVencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    notificaciones.push({
      id:      `timbrado-${t.id}`,
      tipo:    'TIMBRADO',
      nivel:   dias <= 7 ? 'ERROR' : 'WARNING',
      titulo:  'Timbrado por vencer',
      mensaje: `Timbrado ${t.numero} vence en ${dias} día${dias !== 1 ? 's' : ''}`,
      href:    '/miscelaneos/timbrados',
    })
  }

  // Trial por vencer
  if (empresa?.estado === 'TRIAL') {
    const dias = Math.ceil((new Date(empresa.fechaVencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    if (dias <= 10) {
      notificaciones.push({
        id:      'trial',
        tipo:    'TRIAL',
        nivel:   dias <= 3 ? 'ERROR' : 'WARNING',
        titulo:  'Trial por vencer',
        mensaje: `Tu período de prueba vence en ${dias} día${dias !== 1 ? 's' : ''}`,
        href:    '/perfil',
      })
    }
  }

  return NextResponse.json({
    notificaciones,
    total: notificaciones.length,
    errores:   notificaciones.filter(n => n.nivel === 'ERROR').length,
    warnings:  notificaciones.filter(n => n.nivel === 'WARNING').length,
  })
}