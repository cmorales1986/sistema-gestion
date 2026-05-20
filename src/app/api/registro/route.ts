import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      empresaNombre,
      planId,
      adminNombre,
      adminEmail,
      adminPassword,
      colorPrimario,
      colorSecundario,
      logoUrl,
    } = body

    if (!empresaNombre || !planId || !adminNombre || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const emailExistente = await prisma.usuario.findUnique({
      where: { email: adminEmail },
    })
    if (emailExistente) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 400 }
      )
    }

    const slugBase = empresaNombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = slugBase
    const slugExistente = await prisma.empresa.findUnique({ where: { slug } })
    if (slugExistente) {
      slug = `${slugBase}-${Date.now()}`
    }

    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    const resultado = await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nombre: empresaNombre,
          slug,
          planId,
          estado: 'TRIAL',
          fechaVencimiento,
          colorPrimario: colorPrimario || '#1E3A5F',
          colorSecundario: colorSecundario || '#2E6DA4',
          logoUrl: logoUrl || null,
        },
      })

      const usuario = await tx.usuario.create({
        data: {
          nombre: adminNombre,
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 10),
          rol: 'ADMIN',
          empresaId: empresa.id,
        },
      })

      return { empresa, usuario }
    })

    return NextResponse.json({
      ok: true,
      empresaSlug: resultado.empresa.slug,
    })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}