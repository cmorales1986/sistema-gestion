// src/app/api/bancos/conciliacion/[id]/cerrar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const { id }    = await params
  const body      = await req.json().catch(() => ({}))

  const conciliacion = await prisma.conciliacionBancaria.findFirst({
    where: { id, empresaId },
    include: {
      movimientos: { select: { id: true, estado: true } },
      ajustes:     { select: { monto: true } },
    },
  })

  if (!conciliacion) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (conciliacion.estado === 'CERRADA') {
    return NextResponse.json({ error: 'Esta conciliación ya está cerrada' }, { status: 400 })
  }

  // Recalcular diferencia incluyendo ajustes
  const totalAjustes = conciliacion.ajustes.reduce((a, aj) => a + aj.monto, 0)
  const diferenciaFinal = conciliacion.saldoExtracto - (conciliacion.saldoLibros + totalAjustes)

  // Obtener nombre del usuario que cierra
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarioNombre = (session.user as any)?.name || (session.user as any)?.email || 'Usuario'

  const [conciliacionCerrada] = await prisma.$transaction([
    // Cerrar conciliación
    prisma.conciliacionBancaria.update({
      where: { id },
      data: {
        estado:     'CERRADA',
        diferencia: diferenciaFinal,
        cerradaEn:  new Date(),
        cerradaPor: usuarioNombre,
        notas:      body.notas || conciliacion.notas || null,
      },
    }),
    // Marcar todos los movimientos vinculados como CONCILIADO
    prisma.movimientoBancario.updateMany({
      where: { conciliacionId: id },
      data:  { estado: 'CONCILIADO' },
    }),
  ])

  return NextResponse.json(conciliacionCerrada)
}