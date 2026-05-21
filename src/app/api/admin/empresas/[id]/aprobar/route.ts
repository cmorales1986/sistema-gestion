import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { usuarios: { where: { rol: 'ADMIN' }, take: 1 } }
  })

  if (!empresa) {
    return new NextResponse('Empresa no encontrada', { status: 404 })
  }

  if (empresa.estado !== 'PENDIENTE') {
    return new NextResponse(`
      <html><body style="font-family: Arial; text-align: center; padding: 60px; color: #6b7280;">
        <h2>Esta solicitud ya fue procesada</h2>
        <p>Estado actual: <strong>${empresa.estado}</strong></p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  const fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    await tx.empresa.update({
      where: { id },
      data: { estado: 'TRIAL', fechaVencimiento }
    })
    await tx.usuario.updateMany({
      where: { empresaId: id },
      data: { activo: true }
    })
  })

  // Email de bienvenida al usuario
  const usuario = empresa.usuarios[0]
  if (usuario) {
    const resend  = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'

    await resend.emails.send({
      from:    'Sistema de Gestión <onboarding@resend.dev>',
      to:      usuario.email,
      subject: '¡Tu cuenta fue aprobada!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">✓</div>
          </div>
          <h2 style="color: #16a34a; text-align: center; margin-bottom: 8px;">¡Cuenta aprobada!</h2>
          <p style="color: #6b7280; text-align: center; margin-bottom: 24px;">
            Hola <strong>${usuario.nombre}</strong>, tu cuenta para <strong>${empresa.nombre}</strong> fue aprobada.
            Ya podés ingresar al sistema.
          </p>
          <div style="text-align: center;">
            <a href="${baseUrl}/login"
              style="display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Ingresar al sistema
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 24px;">
            Tenés 30 días de prueba gratuita.
          </p>
        </div>
      `
    })
  }

  return new NextResponse(`
    <html>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 60px; background: #f9fafb;">
      <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="width: 56px; height: 56px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
        <h2 style="color: #16a34a; margin-bottom: 8px;">¡Empresa aprobada!</h2>
        <p style="color: #6b7280; margin-bottom: 4px;"><strong>${empresa.nombre}</strong> ahora tiene acceso al sistema.</p>
        <p style="color: #9ca3af; font-size: 13px;">Se envió un email de bienvenida al usuario.</p>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}