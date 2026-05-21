import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nombre, slug, email, password, nombreUsuario } = body

  if (!nombre || !email || !password || !nombreUsuario) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Verificar si el email ya existe
  const usuarioExiste = await prisma.usuario.findUnique({ where: { email } })
  if (usuarioExiste) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 400 })
  }

  // Verificar slug único
  const slugFinal = slug || nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const empresaExiste = await prisma.empresa.findUnique({ where: { slug: slugFinal } })
  if (empresaExiste) {
    return NextResponse.json({ error: 'Ya existe una empresa con ese nombre' }, { status: 400 })
  }

  // Obtener plan básico
  const plan = await prisma.plan.findFirst({ orderBy: { precio: 'asc' } })
  if (!plan) return NextResponse.json({ error: 'No hay planes disponibles' }, { status: 500 })

  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear empresa en estado PENDIENTE
  const empresa = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nombre,
        slug:            slugFinal,
        estado:          'PENDIENTE',
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        planId:          plan.id,
        colorPrimario:   '#1E3A5F',
        colorSecundario: '#2E6DA4',
      }
    })

    await tx.usuario.create({
      data: {
        nombre:    nombreUsuario,
        email,
        password:  hashedPassword,
        rol:       'ADMIN',
        activo:    false, // inactivo hasta que se apruebe
        empresaId: empresa.id,
      }
    })

    await tx.almacen.create({
      data: {
        nombre:    'Almacén Principal',
        activo:    true,
        empresaId: empresa.id,
      }
    })

    return empresa
  })

  // Enviar email al admin del sistema
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = process.env.ADMIN_EMAIL || 'christtian.morales@gmail.com'
  const baseUrl    = process.env.AUTH_URL || 'http://localhost:3000'

  await resend.emails.send({
    from:    'Sistema de Gestión <onboarding@resend.dev>',
    to:      adminEmail,
    subject: `Nueva solicitud de registro — ${nombre}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin-bottom: 4px;">Nueva solicitud de registro</h2>
        <p style="color: #6b7280; margin-bottom: 24px; font-size: 14px;">Una empresa solicitó acceso al sistema.</p>

        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #6b7280; padding: 6px 0; width: 140px;">Empresa</td>
              <td style="color: #111827; font-weight: bold;">${nombre}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0;">Responsable</td>
              <td style="color: #111827;">${nombreUsuario}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0;">Email</td>
              <td style="color: #111827;">${email}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0;">Fecha</td>
              <td style="color: #111827;">${new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          </table>
        </div>

        <div style="display: flex; gap: 12px;">
          <a href="${baseUrl}/admin/empresas/${empresa.id}/aprobar"
            style="flex: 1; display: inline-block; text-align: center; background-color: #16a34a; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            ✓ Aprobar
          </a>
          <a href="${baseUrl}/admin/empresas/${empresa.id}/rechazar"
            style="flex: 1; display: inline-block; text-align: center; background-color: #dc2626; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            ✗ Rechazar
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
          También podés gestionar las solicitudes en
          <a href="${baseUrl}/admin/empresas" style="color: #1e3a5f;">el panel de administración</a>
        </p>
      </div>
    `
  })

  // Email de confirmación al usuario
  await resend.emails.send({
    from:    'Sistema de Gestión <onboarding@resend.dev>',
    to:      email,
    subject: 'Solicitud de registro recibida',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin-bottom: 8px;">¡Solicitud recibida!</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">
          Hola <strong>${nombreUsuario}</strong>, recibimos tu solicitud de acceso para <strong>${nombre}</strong>.
        </p>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Estamos revisando tu solicitud y te avisaremos por este medio en las próximas horas.
        </p>
        <p style="color: #9ca3af; font-size: 13px;">
          Si tenés alguna consulta podés contactarnos por WhatsApp:
          <a href="https://wa.me/595981612950" style="color: #1e3a5f;">+595 981 612 950</a>
        </p>
      </div>
    `
  })

  return NextResponse.json({ ok: true })
}