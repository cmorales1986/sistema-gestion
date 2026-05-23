import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEmpresaId } from '@/lib/get-empresa-id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      nombre:               true,
      onboardingCompletado: true,
      colorPrimario:        true,
      colorSecundario:      true,
    }
  })

  return NextResponse.json(empresa)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const empresaId = await getEmpresaId(session)
  const body      = await req.json()

  await prisma.$transaction(async (tx) => {

    // Paso 2 — Monedas
    if (body.monedas?.length) {
      for (const m of body.monedas) {
        await tx.moneda.upsert({
          where: { codigo_empresaId: { codigo: m.codigo, empresaId } },
          create: {
            codigo:    m.codigo,
            nombre:    m.nombre,
            simbolo:   m.simbolo,
            principal: m.principal || false,
            empresaId,
          },
          update: { principal: m.principal || false }
        })
      }
    }

    // Paso 3 — Impuestos
    if (body.impuestos?.length) {
      for (const imp of body.impuestos) {
        const existe = await tx.impuesto.findFirst({
          where: { nombre: imp.nombre, empresaId }
        })
        if (!existe) {
          await tx.impuesto.create({
            data: {
              nombre:     imp.nombre,
              porcentaje: imp.porcentaje,
              empresaId,
            }
          })
        }
      }
    }

    // Paso 4 — Condiciones de pago
    if (body.condiciones?.length) {
      for (const c of body.condiciones) {
        const existe = await tx.condicionPago.findFirst({
          where: { nombre: c.nombre, empresaId }
        })
        if (!existe) {
          await tx.condicionPago.create({
            data: {
              nombre:   c.nombre,
              dias:     c.dias,
              empresaId,
            }
          })
        }
      }
    }

    // Paso 5 — Almacén
    if (body.almacen) {
      const almacenes = await tx.almacen.findMany({ where: { empresaId } })
      if (almacenes.length === 1) {
        await tx.almacen.update({
          where: { id: almacenes[0].id },
          data:  { nombre: body.almacen }
        })
      }
    }

    // Paso 6 — Timbrado
    if (body.timbrado) {
      await tx.timbrado.create({
        data: {
          numero:           body.timbrado.numero,
          serie1:           body.timbrado.serie1.padStart(3, '0'),
          serie2:           body.timbrado.serie2.padStart(3, '0'),
          desde:            parseInt(body.timbrado.desde),
          hasta:            parseInt(body.timbrado.hasta),
          siguiente:        parseInt(body.timbrado.desde),
          fechaInicio:      new Date(body.timbrado.fechaInicio),
          fechaVencimiento: new Date(body.timbrado.fechaVencimiento),
          activo:           true,
          empresaId,
        }
      })
    }

    // Marcar onboarding como completado
    await tx.empresa.update({
      where: { id: empresaId },
      data:  { onboardingCompletado: true }
    })
  })

  return NextResponse.json({ ok: true })
}