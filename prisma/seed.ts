import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const planBasico = await prisma.plan.upsert({
    where: { id: 'plan-basico' },
    update: {},
    create: {
      id: 'plan-basico',
      nombre: 'Basico',
      precio: 180000,
      descripcion: 'Acceso completo al sistema para equipos pequeños.',
    },
  })

  const planPro = await prisma.plan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      nombre: 'Pro',
      precio: 250000,
      descripcion: 'Todo el plan Basico mas reportes avanzados y soporte prioritario.',
    },
  })

  const empresaLinkea = await prisma.empresa.upsert({
    where: { slug: 'linkea' },
    update: {},
    create: {
      slug: 'linkea',
      nombre: 'Linkea',
      estado: 'ACTIVO',
      fechaVencimiento: new Date('2099-12-31'),
      planId: planPro.id,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'admin@linkea.com' },
    update: {},
    create: {
      nombre: 'Admin Linkea',
      email: 'admin@linkea.com',
      password: await bcrypt.hash('Admin1234!', 10),
      rol: 'SUPERADMIN',
      empresaId: empresaLinkea.id,
    },
  })

  console.log('Seed OK — Planes y superadmin creados')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())