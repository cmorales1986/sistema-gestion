/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ logoUrl: null })

  const empresaId = (session.user as any).empresaId
  if (!empresaId) return NextResponse.json({ logoUrl: null })

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { logoUrl: true },
  })

  return NextResponse.json({ logoUrl: empresa?.logoUrl || null })
}