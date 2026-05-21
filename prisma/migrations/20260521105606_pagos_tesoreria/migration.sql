-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateTable
CREATE TABLE "PagoCompra" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "medioPago" "MedioPago" NOT NULL DEFAULT 'EFECTIVO',
    "nroReferencia" TEXT,
    "observacion" TEXT,
    "compraId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoVenta" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "medioPago" "MedioPago" NOT NULL DEFAULT 'EFECTIVO',
    "nroReferencia" TEXT,
    "observacion" TEXT,
    "ventaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoCompra_compraId_idx" ON "PagoCompra"("compraId");

-- CreateIndex
CREATE INDEX "PagoCompra_empresaId_fecha_idx" ON "PagoCompra"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "PagoVenta_ventaId_idx" ON "PagoVenta"("ventaId");

-- CreateIndex
CREATE INDEX "PagoVenta_empresaId_fecha_idx" ON "PagoVenta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Articulo_empresaId_activo_idx" ON "Articulo"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Articulo_empresaId_nombre_idx" ON "Articulo"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_activo_idx" ON "Cliente"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Compra_empresaId_fecha_idx" ON "Compra"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Compra_empresaId_estado_idx" ON "Compra"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Compra_empresaId_estadoPago_idx" ON "Compra"("empresaId", "estadoPago");

-- CreateIndex
CREATE INDEX "CompraDetalle_compraId_idx" ON "CompraDetalle"("compraId");

-- CreateIndex
CREATE INDEX "CompraDetalle_articuloId_idx" ON "CompraDetalle"("articuloId");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_activo_idx" ON "Proveedor"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Stock_articuloId_idx" ON "Stock"("articuloId");

-- CreateIndex
CREATE INDEX "Stock_almacenId_idx" ON "Stock"("almacenId");

-- CreateIndex
CREATE INDEX "Venta_empresaId_fecha_idx" ON "Venta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Venta_empresaId_estado_idx" ON "Venta"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Venta_empresaId_estadoPago_idx" ON "Venta"("empresaId", "estadoPago");

-- CreateIndex
CREATE INDEX "VentaDetalle_ventaId_idx" ON "VentaDetalle"("ventaId");

-- CreateIndex
CREATE INDEX "VentaDetalle_articuloId_idx" ON "VentaDetalle"("articuloId");

-- AddForeignKey
ALTER TABLE "PagoCompra" ADD CONSTRAINT "PagoCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCompra" ADD CONSTRAINT "PagoCompra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
