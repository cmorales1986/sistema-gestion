import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const planes = await prisma.plan.findMany({
      where: { activo: true },
      orderBy: { precio: 'asc' },
    })
    return NextResponse.json(planes)
  } catch (error) {
    console.error('Error al obtener planes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}