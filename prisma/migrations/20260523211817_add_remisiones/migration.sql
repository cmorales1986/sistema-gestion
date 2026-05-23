-- CreateEnum
CREATE TYPE "TipoRemision" AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "MotivoEntrada" AS ENUM ('REMISION_COMPRA', 'DEVOLUCION_CLIENTE', 'DONACION', 'AJUSTE_POSITIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "MotivoSalida" AS ENUM ('REMISION_VENTA', 'PERDIDA', 'VENCIMIENTO', 'MUESTRA', 'AJUSTE_NEGATIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoRemision" AS ENUM ('BORRADOR', 'CONFIRMADA', 'ANULADA');

-- CreateTable
CREATE TABLE "Remision" (
    "id" TEXT NOT NULL,
    "numero" TEXT,
    "tipo" "TipoRemision" NOT NULL,
    "esFiscal" BOOLEAN NOT NULL DEFAULT false,
    "nroComprobante" TEXT,
    "timbradoNro" TEXT,
    "serie1" TEXT,
    "serie2" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivoEntrada" "MotivoEntrada",
    "motivoSalida" "MotivoSalida",
    "observacion" TEXT,
    "estado" "EstadoRemision" NOT NULL DEFAULT 'BORRADOR',
    "almacenOrigenId" TEXT,
    "almacenDestinoId" TEXT,
    "empresaId" TEXT NOT NULL,
    "creadoPor" TEXT,
    "anulacionMotivo" TEXT,
    "anulacionFecha" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemisionDetalle" (
    "id" TEXT NOT NULL,
    "remisionId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnit" DOUBLE PRECISION,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemisionDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Remision_empresaId_tipo_idx" ON "Remision"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "Remision_empresaId_estado_idx" ON "Remision"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Remision_empresaId_fecha_idx" ON "Remision"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "RemisionDetalle_remisionId_idx" ON "RemisionDetalle"("remisionId");

-- CreateIndex
CREATE INDEX "RemisionDetalle_articuloId_idx" ON "RemisionDetalle"("articuloId");

-- AddForeignKey
ALTER TABLE "Remision" ADD CONSTRAINT "Remision_almacenOrigenId_fkey" FOREIGN KEY ("almacenOrigenId") REFERENCES "Almacen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remision" ADD CONSTRAINT "Remision_almacenDestinoId_fkey" FOREIGN KEY ("almacenDestinoId") REFERENCES "Almacen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remision" ADD CONSTRAINT "Remision_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemisionDetalle" ADD CONSTRAINT "RemisionDetalle_remisionId_fkey" FOREIGN KEY ("remisionId") REFERENCES "Remision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemisionDetalle" ADD CONSTRAINT "RemisionDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
