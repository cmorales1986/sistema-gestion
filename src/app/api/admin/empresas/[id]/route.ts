/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = session.user as any
  if (user.rol !== 'SUPERADMIN') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { id }  = await params
  const body    = await req.json()

  const data: any = {}

  if (body.estado) data.estado = body.estado

  if (body.diasExtra) {
    const empresa = await prisma.empresa.findUnique({ where: { id } })
    if (empresa) {
      const base = new Date(empresa.fechaVencimiento) > new Date()
        ? new Date(empresa.fechaVencimiento)
        : new Date()
      data.fechaVencimiento = new Date(base.getTime() + body.diasExtra * 24 * 60 * 60 * 1000)
    }
  }

  if (body.estado === 'ACTIVO' || body.estado === 'TRIAL') {
    // Activar usuarios
    await prisma.usuario.updateMany({
      where: { empresaId: id },
      data: { activo: true }
    })
  }

  if (body.estado === 'SUSPENDIDO') {
    // Desactivar usuarios
    await prisma.usuario.updateMany({
      where: { empresaId: id },
      data: { activo: false }
    })
  }

  const empresa = await prisma.empresa.update({
    where: { id },
    data,
  })

  return NextResponse.json(empresa)
}