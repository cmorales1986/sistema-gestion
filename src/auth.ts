/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.usuario.findUnique({
          where: { email: user.email! },
          include: {
            empresa: {
              include: { plan: true },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.rol = dbUser.rol;
          token.empresaId = dbUser.empresaId;
          token.empresaNombre = dbUser.empresa.nombre;
          token.colorPrimario = dbUser.empresa.colorPrimario;
          token.colorSecundario = dbUser.empresa.colorSecundario;
          token.logoUrl = dbUser.empresa.logoUrl;
          token.planId = dbUser.empresa.planId;
          token.planNombre = dbUser.empresa.plan?.nombre || "";
          token.onboarding = dbUser.empresa.onboardingCompletado

          // Guardá solo IDs/valores simples, no arrays grandes
          token.modulos = (dbUser.empresa.plan?.modulos || []).join(",");
          token.reportes = (dbUser.empresa.plan?.reportes || []).join(",");
          token.limProv = dbUser.empresa.plan?.limiteProveedores ?? -1;
          token.limCli = dbUser.empresa.plan?.limiteClientes ?? -1;
          token.limArt = dbUser.empresa.plan?.limiteArticulos ?? -1;
          token.limUsu = dbUser.empresa.plan?.limiteUsuarios ?? -1;
          token.limFC = dbUser.empresa.plan?.limiteFacturasCompra ?? -1;
          token.limFV = dbUser.empresa.plan?.limiteFacturasVenta ?? -1;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any;
        u.id = token.id;
        u.rol = token.rol;
        u.empresaId = token.empresaId;
        u.empresaNombre = token.empresaNombre;
        u.colorPrimario = token.colorPrimario;
        u.colorSecundario = token.colorSecundario;
        u.logoUrl = token.logoUrl;
        u.planId = token.planId;
        u.planNombre = token.planNombre;
        u.onboarding = token.onboarding

        // Reconstruir arrays desde strings
        u.modulos = token.modulos
          ? (token.modulos as string).split(",").filter(Boolean)
          : [];
        u.reportes = token.reportes
          ? (token.reportes as string).split(",").filter(Boolean)
          : [];

        // Reconstruir limites (-1 = null = ilimitado)
        u.limites = {
          proveedores: token.limProv === -1 ? null : token.limProv,
          clientes: token.limCli === -1 ? null : token.limCli,
          articulos: token.limArt === -1 ? null : token.limArt,
          usuarios: token.limUsu === -1 ? null : token.limUsu,
          facturasCompra: token.limFC === -1 ? null : token.limFC,
          facturasVenta: token.limFV === -1 ? null : token.limFV,
        };
      }
      return session;
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
