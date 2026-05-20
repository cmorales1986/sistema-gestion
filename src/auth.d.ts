import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: string
      empresaId: string
      empresaSlug: string
      empresaNombre: string
      logoUrl: string | null
      colorPrimario: string
      colorSecundario: string
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    rol: string
    empresaId: string
    empresaSlug: string
    empresaNombre: string
    logoUrl: string | null
    colorPrimario: string
    colorSecundario: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: string
    empresaId: string
    empresaSlug: string
    empresaNombre: string
    logoUrl: string | null
    colorPrimario: string
    colorSecundario: string
  }
}