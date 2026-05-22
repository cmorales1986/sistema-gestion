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
              include: {
                plan: true,
              },
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
          token.planNombre = dbUser.empresa.plan?.nombre || "";
          token.planId = dbUser.empresa.plan?.id || "";

          // ← Nuevos campos
          token.modulos = dbUser.empresa.plan?.modulos || [];
          token.reportes = dbUser.empresa.plan?.reportes || [];
          token.limites = {
            proveedores: dbUser.empresa.plan?.limiteProveedores ?? null,
            clientes: dbUser.empresa.plan?.limiteClientes ?? null,
            articulos: dbUser.empresa.plan?.limiteArticulos ?? null,
            usuarios: dbUser.empresa.plan?.limiteUsuarios ?? null,
            facturasCompra: dbUser.empresa.plan?.limiteFacturasCompra ?? null,
            facturasVenta: dbUser.empresa.plan?.limiteFacturasVenta ?? null,
          };
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).rol = token.rol;
        (session.user as any).empresaId = token.empresaId;
        (session.user as any).empresaNombre = token.empresaNombre;
        (session.user as any).colorPrimario = token.colorPrimario;
        (session.user as any).colorSecundario = token.colorSecundario;
        (session.user as any).logoUrl = token.logoUrl;
        (session.user as any).planNombre = token.planNombre;
        (session.user as any).planId = token.planId;

        // ← Nuevos campos
        (session.user as any).modulos = token.modulos;
        (session.user as any).reportes = token.reportes;
        (session.user as any).limites = token.limites;
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
