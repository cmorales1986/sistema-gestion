-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "timbradoId" TEXT;

-- CreateTable
CREATE TABLE "Timbrado" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie1" TEXT NOT NULL,
    "serie2" TEXT NOT NULL,
    "desde" INTEGER NOT NULL,
    "hasta" INTEGER NOT NULL,
    "siguiente" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timbrado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_timbradoId_fkey" FOREIGN KEY ("timbradoId") REFERENCES "Timbrado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timbrado" ADD CONSTRAINT "Timbrado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
