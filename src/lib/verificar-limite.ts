import { prisma } from '@/lib/prisma'

type LimiteCheck = {
  empresaId: string
  tipo: 'proveedores' | 'clientes' | 'articulos' | 'usuarios' | 'facturasCompra' | 'facturasVenta'
  limites: {
    proveedores:    number | null
    clientes:       number | null
    articulos:      number | null
    usuarios:       number | null
    facturasCompra: number | null
    facturasVenta:  number | null
  }
}

export async function verificarLimite({ empresaId, tipo, limites }: LimiteCheck): Promise<{ ok: boolean; mensaje?: string }> {
  const limite = limites[tipo]

  // null = ilimitado
  if (limite === null || limite === undefined) return { ok: true }

  // Contar registros actuales
  let count = 0

  switch (tipo) {
    case 'proveedores':
      count = await prisma.proveedor.count({
        where: { empresaId, activo: true }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} proveedores. Actualizá tu plan para agregar más.`
      }
      break

    case 'clientes':
      count = await prisma.cliente.count({
        where: { empresaId, activo: true }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} clientes. Actualizá tu plan para agregar más.`
      }
      break

    case 'articulos':
      count = await prisma.articulo.count({
        where: { empresaId, activo: true }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} artículos. Actualizá tu plan para agregar más.`
      }
      break

    case 'usuarios':
      count = await prisma.usuario.count({
        where: { empresaId, activo: true }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} usuario${limite !== 1 ? 's' : ''}. Actualizá tu plan para agregar más.`
      }
      break

    case 'facturasCompra': {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      count = await prisma.compra.count({
        where: {
          empresaId,
          estado: { not: 'ANULADA' },
          fecha: { gte: inicioMes }
        }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} facturas de compra por mes. Actualizá tu plan para continuar.`
      }
      break
    }

    case 'facturasVenta': {
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      count = await prisma.venta.count({
        where: {
          empresaId,
          estado: { not: 'ANULADA' },
          fecha: { gte: inicioMes }
        }
      })
      if (count >= limite) return {
        ok: false,
        mensaje: `Tu plan permite hasta ${limite} facturas de venta por mes. Actualizá tu plan para continuar.`
      }
      break
    }
  }

  return { ok: true }
}