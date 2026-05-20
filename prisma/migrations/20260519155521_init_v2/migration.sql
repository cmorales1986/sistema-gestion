/*
  Warnings:

  - You are about to drop the column `cantidad` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `modalidad` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `nroFactura` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `precioContado` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `precioCredito` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `cantidad` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `modalidad` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `precioContado` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `precioCredito` on the `Venta` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoIva" AS ENUM ('EXENTA', 'IVA5', 'IVA10');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA', 'TICKET', 'RECIBO', 'NOTA_PEDIDO');

-- CreateEnum
CREATE TYPE "CondicionPago" AS ENUM ('CONTADO', 'CREDITO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('PYG', 'USD', 'BRL');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- CreateEnum
CREATE TYPE "EstadoDoc" AS ENUM ('BORRADOR', 'CONFIRMADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoNotaCredito" AS ENUM ('DEVOLUCION_PRODUCTO', 'AJUSTE_PRECIO');

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "cantidad",
DROP COLUMN "modalidad",
DROP COLUMN "nroFactura",
DROP COLUMN "precioContado",
DROP COLUMN "precioCredito",
ADD COLUMN     "condicionPago" "CondicionPago" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "diasCredito" INTEGER,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'PYG',
ADD COLUMN     "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "nroComprobante" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'FACTURA',
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalIva10" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalIva5" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "cantidad",
DROP COLUMN "modalidad",
DROP COLUMN "precioContado",
DROP COLUMN "precioCredito",
ADD COLUMN     "condicionPago" "CondicionPago" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "diasCredito" INTEGER,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'PYG',
ADD COLUMN     "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'FACTURA',
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalIva10" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalIva5" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "Modalidad";

-- CreateTable
CREATE TABLE "Almacen" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Articulo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidadMedida" TEXT NOT NULL DEFAULT 'unidad',
    "inventariable" BOOLEAN NOT NULL DEFAULT true,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioCompra" DOUBLE PRECISION,
    "precioVenta" DOUBLE PRECISION,
    "iva" "TipoIva" NOT NULL DEFAULT 'IVA10',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Articulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "articuloId" TEXT NOT NULL,
    "almacenId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iva" "TipoIva" NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "compraId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompraDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCreditoCompra" (
    "id" TEXT NOT NULL,
    "nroComprobante" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoNotaCredito" NOT NULL,
    "motivo" TEXT,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
    "compraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCreditoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCreditoCompraDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION,
    "precioUnitario" DOUBLE PRECISION,
    "montoAjuste" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "articuloId" TEXT,
    "notaCreditoCompraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCreditoCompraDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iva" "TipoIva" NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "ventaId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCreditoVenta" (
    "id" TEXT NOT NULL,
    "nroComprobante" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoNotaCredito" NOT NULL,
    "motivo" TEXT,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
    "ventaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCreditoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCreditoVentaDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION,
    "precioUnitario" DOUBLE PRECISION,
    "montoAjuste" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "articuloId" TEXT,
    "notaCreditoVentaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCreditoVentaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_articuloId_almacenId_key" ON "Stock"("articuloId", "almacenId");

-- AddForeignKey
ALTER TABLE "Almacen" ADD CONSTRAINT "Almacen_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_almacenId_fkey" FOREIGN KEY ("almacenId") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoCompra" ADD CONSTRAINT "NotaCreditoCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoCompraDetalle" ADD CONSTRAINT "NotaCreditoCompraDetalle_notaCreditoCompraId_fkey" FOREIGN KEY ("notaCreditoCompraId") REFERENCES "NotaCreditoCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoVenta" ADD CONSTRAINT "NotaCreditoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoVentaDetalle" ADD CONSTRAINT "NotaCreditoVentaDetalle_notaCreditoVentaId_fkey" FOREIGN KEY ("notaCreditoVentaId") REFERENCES "NotaCreditoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
