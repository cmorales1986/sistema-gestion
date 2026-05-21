/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      id: true, nombre: true, slug: true,
      logoUrl: true, colorPrimario: true, colorSecundario: true,
      estado: true, fechaVencimiento: true,
      plan: { select: { nombre: true, precio: true } },
    }
  })

  return NextResponse.json(empresa)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = (session.user as any).empresaId
  const body = await req.json()

  const empresa = await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      nombre:         body.nombre,
      colorPrimario:  body.colorPrimario,
      colorSecundario: body.colorSecundario,
      logoUrl:        body.logoUrl || null,
    },
    select: {
      id: true, nombre: true, logoUrl: true,
      colorPrimario: true, colorSecundario: true,
    }
  })

  return NextResponse.json(empresa)
}