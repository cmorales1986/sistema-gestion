/*
  Warnings:

  - You are about to drop the column `iva` on the `Articulo` table. All the data in the column will be lost.
  - You are about to drop the column `condicionPago` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `diasCredito` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `moneda` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `iva` on the `CompraDetalle` table. All the data in the column will be lost.
  - You are about to drop the column `condicionPago` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `diasCredito` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `moneda` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `iva` on the `VentaDetalle` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoPeriodo" AS ENUM ('ABIERTO', 'CERRADO');

-- AlterTable
ALTER TABLE "Articulo" DROP COLUMN "iva",
ADD COLUMN     "impuestoId" TEXT;

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "condicionPago",
DROP COLUMN "diasCredito",
DROP COLUMN "moneda",
ADD COLUMN     "condicionPagoId" TEXT,
ADD COLUMN     "monedaId" TEXT;

-- AlterTable
ALTER TABLE "CompraDetalle" DROP COLUMN "iva",
ADD COLUMN     "impuestoId" TEXT;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "condicionPago",
DROP COLUMN "diasCredito",
DROP COLUMN "moneda",
ADD COLUMN     "condicionPagoId" TEXT,
ADD COLUMN     "monedaId" TEXT;

-- AlterTable
ALTER TABLE "VentaDetalle" DROP COLUMN "iva",
ADD COLUMN     "impuestoId" TEXT;

-- DropEnum
DROP TYPE "CondicionPago";

-- DropEnum
DROP TYPE "Moneda";

-- DropEnum
DROP TYPE "TipoIva";

-- CreateTable
CREATE TABLE "CondicionPago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dias" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CondicionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impuesto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Impuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moneda" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moneda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoCambio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "monedaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoContable" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPeriodo" NOT NULL DEFAULT 'ABIERTO',
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoContable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moneda_codigo_empresaId_key" ON "Moneda"("codigo", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_monedaId_fecha_key" ON "TipoCambio"("monedaId", "fecha");

-- AddForeignKey
ALTER TABLE "CondicionPago" ADD CONSTRAINT "CondicionPago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impuesto" ADD CONSTRAINT "Impuesto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moneda" ADD CONSTRAINT "Moneda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoCambio" ADD CONSTRAINT "TipoCambio_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoCambio" ADD CONSTRAINT "TipoCambio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodoContable" ADD CONSTRAINT "PeriodoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_condicionPagoId_fkey" FOREIGN KEY ("condicionPagoId") REFERENCES "CondicionPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_condicionPagoId_fkey" FOREIGN KEY ("condicionPagoId") REFERENCES "CondicionPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
