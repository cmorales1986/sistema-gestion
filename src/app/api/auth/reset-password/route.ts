import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  })

  if (!resetToken) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  if (resetToken.usado) {
    return NextResponse.json({ error: 'Este enlace ya fue utilizado' }, { status: 400 })
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json({ error: 'El enlace ha expirado. Solicitá uno nuevo.' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { email: resetToken.email },
      data:  { password: hashedPassword }
    })

    await tx.passwordResetToken.update({
      where: { token },
      data:  { usado: true }
    })
  })

  return NextResponse.json({ ok: true })
}