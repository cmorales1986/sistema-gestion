/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { estado: true, fechaVencimiento: true }
  })

  if (!empresa || empresa.estado !== 'TRIAL') {
    return NextResponse.json({ diasRestantes: null })
  }

  const hoy = new Date()
  const vencimiento = new Date(empresa.fechaVencimiento)
  const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  return NextResponse.json({ diasRestantes })
}