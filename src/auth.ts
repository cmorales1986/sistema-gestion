/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.rol = (user as any).rol
    token.empresaId = (user as any).empresaId
    token.empresaSlug = (user as any).empresaSlug
    token.colorPrimario = (user as any).colorPrimario
    token.colorSecundario = (user as any).colorSecundario
    token.empresaNombre = (user as any).empresaNombre
  }
  return token
},
async session({ session, token }) {
  if (token) {
    const u = session.user as any
    u.id = token.id
    u.rol = token.rol
    u.empresaId = token.empresaId
    u.empresaSlug = token.empresaSlug
    u.colorPrimario = token.colorPrimario
    u.colorSecundario = token.colorSecundario
    u.empresaNombre = token.empresaNombre
  }
  return session
},
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
          include: { empresa: true },
        });

        if (!usuario || !usuario.activo) return null;

        const passwordOk = await bcrypt.compare(
          credentials.password as string,
          usuario.password,
        );
        if (!passwordOk) return null;

        if (usuario.empresa.estado === "SUSPENDIDO") return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          empresaId: usuario.empresaId,
          empresaSlug: usuario.empresa.slug,
          empresaNombre: usuario.empresa.nombre,
          logoUrl: usuario.empresa.logoUrl,
          colorPrimario: usuario.empresa.colorPrimario,
          colorSecundario: usuario.empresa.colorSecundario,
        };
      },
    }),
  ],
});
