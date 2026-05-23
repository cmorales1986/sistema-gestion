/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id:              string
      rol:             string
      empresaId:       string
      empresaNombre:   string
      colorPrimario:   string
      colorSecundario: string
      logoUrl:         string | null
      planNombre:      string
      planId:          string
      modulos:         string[]
      reportes:        string[]
      onboarding: boolean
      limites: {
        proveedores:    number | null
        clientes:       number | null
        articulos:      number | null
        usuarios:       number | null
        facturasCompra: number | null
        facturasVenta:  number | null
      }
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:              string
    rol:             string
    empresaId:       string
    empresaNombre:   string
    colorPrimario:   string
    colorSecundario: string
    logoUrl:         string | null
    planNombre:      string
    planId:          string
    modulos:         string  // guardado como string separado por comas
    reportes:        string
    limProv:         number
    limCli:          number
    limArt:          number
    onboarding: boolean
    limUsu:          number
    limFC:           number
    limFV:           number
  }
}