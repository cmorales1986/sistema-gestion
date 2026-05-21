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

  await prisma.empresa.update({
    where: { id },
    data: { estado: 'SUSPENDIDO' }
  })

  // Email al usuario avisando el rechazo
  const usuario = empresa.usuarios[0]
  if (usuario) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from:    'Sistema de Gestión <onboarding@resend.dev>',
      to:      usuario.email,
      subject: 'Solicitud de registro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1e3a5f; margin-bottom: 8px;">Solicitud de registro</h2>
          <p style="color: #6b7280; margin-bottom: 16px;">
            Hola <strong>${usuario.nombre}</strong>, lamentablemente tu solicitud de acceso para <strong>${empresa.nombre}</strong> no pudo ser procesada en este momento.
          </p>
          <p style="color: #6b7280; margin-bottom: 24px;">
            Para más información podés contactarnos por WhatsApp:
          </p>
          <a href="https://wa.me/595981612950"
            style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Contactar por WhatsApp
          </a>
        </div>
      `
    })
  }

  return new NextResponse(`
    <html>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 60px; background: #f9fafb;">
      <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="width: 56px; height: 56px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✗</div>
        <h2 style="color: #dc2626; margin-bottom: 8px;">Solicitud rechazada</h2>
        <p style="color: #6b7280; margin-bottom: 4px;"><strong>${empresa.nombre}</strong> fue notificada por email.</p>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}