import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email)
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Por seguridad siempre respondemos OK aunque no exista el usuario
  if (!usuario) return NextResponse.json({ ok: true });

  // Invalidar tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { email, usado: false },
    data: { usado: true },
  });

  // Crear nuevo token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "Sistema de Gestión <onboarding@resend.dev>",
    to: email,
    subject: "Recuperar contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1e3a5f; margin-bottom: 8px;">Recuperar contraseña</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Hacé click en el botón para continuar.
        </p>
        <a href="${resetUrl}"
          style="display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
          Restablecer contraseña
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          Este enlace vence en 1 hora. Si no solicitaste esto, ignorá este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #d1d5db; font-size: 12px;">Sistema de Gestión</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
