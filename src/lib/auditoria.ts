/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma'

type AuditoriaParams = {
  empresaId:   string
  usuarioId?:  string
  modulo:      string
  accion:      string
  descripcion: string
  metadata?:   Record<string, any>
}

export async function registrarAuditoria(params: AuditoriaParams) {
  try {
    await prisma.auditoria.create({
      data: {
        empresaId:   params.empresaId,
        usuarioId:   params.usuarioId || null,
        modulo:      params.modulo,
        accion:      params.accion,
        descripcion: params.descripcion,
        ...(params.metadata && { metadata: params.metadata }),
      }
    })
  } catch (error) {
    // No rompemos el flujo si falla la auditoría
    console.error('Error registrando auditoría:', error)
  }
}

export const MODULOS = {
  VENTAS:    'VENTAS',
  COMPRAS:   'COMPRAS',
  COBROS:    'COBROS',
  PAGOS:     'PAGOS',
  CAJA:      'CAJA',
  STOCK:     'STOCK',
  ARTICULOS: 'ARTICULOS',
  CLIENTES:  'CLIENTES',
  PROVEEDORES: 'PROVEEDORES',
  USUARIOS:  'USUARIOS',
  EMPRESA:   'EMPRESA',
}

export const ACCIONES = {
  CREAR:    'CREAR',
  EDITAR:   'EDITAR',
  ANULAR:   'ANULAR',
  ELIMINAR: 'ELIMINAR',
  PAGO:     'PAGO',
  COBRO:    'COBRO',
  APERTURA_CAJA: 'APERTURA_CAJA',
  CIERRE_CAJA:   'CIERRE_CAJA',
  LOGIN:    'LOGIN',
}