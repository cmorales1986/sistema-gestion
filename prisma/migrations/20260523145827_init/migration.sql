-- CreateEnum
CREATE TYPE "EstadoEmpresa" AS ENUM ('PENDIENTE', 'TRIAL', 'ACTIVO', 'SUSPENDIDO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "EstadoPeriodo" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA', 'TICKET', 'RECIBO', 'NOTA_PEDIDO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- CreateEnum
CREATE TYPE "EstadoDoc" AS ENUM ('BORRADOR', 'CONFIRMADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoNotaCredito" AS ENUM ('DEVOLUCION_PRODUCTO', 'AJUSTE_PRECIO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "OrigenMovimiento" AS ENUM ('MANUAL', 'COBRO_VENTA', 'PAGO_COMPRA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "TipoCheque" AS ENUM ('COMUN', 'DIFERIDO');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('EN_CARTERA', 'A_DEPOSITAR', 'DEPOSITADO', 'ACREDITADO', 'RECHAZADO', 'ANULADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoBancario" AS ENUM ('DEBITO', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoMovimientoBancario" AS ENUM ('PENDIENTE', 'CONCILIADO');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('BORRADOR', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoAjuste" AS ENUM ('NOTA_CREDITO_BANCO', 'NOTA_DEBITO_BANCO', 'DEPOSITO_EN_TRANSITO', 'CHEQUE_EN_CIRCULACION', 'ERROR_REGISTRO', 'OTRO');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "modulos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limiteProveedores" INTEGER,
    "limiteClientes" INTEGER,
    "limiteArticulos" INTEGER,
    "limiteUsuarios" INTEGER,
    "limiteFacturasCompra" INTEGER,
    "limiteFacturasVenta" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#1E3A5F',
    "colorSecundario" TEXT NOT NULL DEFAULT '#2E6DA4',
    "estado" "EstadoEmpresa" NOT NULL DEFAULT 'TRIAL',
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "onboardingCompletado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

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
    "impuestoId" TEXT,
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
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "nroComprobante" TEXT,
    "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'FACTURA',
    "fecha" TIMESTAMP(3) NOT NULL,
    "condicionPagoId" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "monedaId" TEXT,
    "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIva5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIva10" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
    "observacion" TEXT,
    "proveedorId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impuestoId" TEXT,
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
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "nroComprobante" TEXT,
    "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'FACTURA',
    "fecha" TIMESTAMP(3) NOT NULL,
    "condicionPagoId" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "monedaId" TEXT,
    "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIva5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIva10" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoDoc" NOT NULL DEFAULT 'CONFIRMADA',
    "observacion" TEXT,
    "clienteId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timbradoId" TEXT,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaDetalle" (
    "id" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impuestoId" TEXT,
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

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AperturaCaja" (
    "id" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoFinal" DOUBLE PRECISION,
    "saldoReal" DOUBLE PRECISION,
    "diferencia" DOUBLE PRECISION,
    "observacionCierre" TEXT,
    "estado" "EstadoCaja" NOT NULL DEFAULT 'ABIERTA',
    "usuarioAperturaId" TEXT NOT NULL,
    "usuarioCierreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AperturaCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "aperturaCajaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "origen" "OrigenMovimiento" NOT NULL DEFAULT 'MANUAL',
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banco" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaBancaria" (
    "id" TEXT NOT NULL,
    "bancoId" TEXT NOT NULL,
    "nroCuenta" TEXT NOT NULL,
    "descripcion" TEXT,
    "monedaId" TEXT,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cheque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCheque" NOT NULL DEFAULT 'COMUN',
    "movimiento" TEXT NOT NULL,
    "nroCheque" TEXT NOT NULL,
    "bancoId" TEXT,
    "bancoNombre" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "diasDiferido" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoCheque" NOT NULL DEFAULT 'EN_CARTERA',
    "beneficiario" TEXT,
    "emisor" TEXT,
    "observacion" TEXT,
    "pagoCompraId" TEXT,
    "pagoVentaId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoBancario" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoBancario" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoMovimientoBancario" NOT NULL DEFAULT 'PENDIENTE',
    "referenciaId" TEXT,
    "referenciaTipo" TEXT,
    "chequeId" TEXT,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conciliacionId" TEXT,

    CONSTRAINT "MovimientoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConciliacionBancaria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3) NOT NULL,
    "saldoExtracto" DOUBLE PRECISION NOT NULL,
    "saldoLibros" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'BORRADOR',
    "notas" TEXT,
    "cerradaEn" TIMESTAMP(3),
    "cerradaPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConciliacionBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteConciliacion" (
    "id" TEXT NOT NULL,
    "conciliacionId" TEXT NOT NULL,
    "tipo" "TipoAjuste" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjusteConciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Moneda_codigo_empresaId_key" ON "Moneda"("codigo", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_monedaId_fecha_key" ON "TipoCambio"("monedaId", "fecha");

-- CreateIndex
CREATE INDEX "Articulo_empresaId_activo_idx" ON "Articulo"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Articulo_empresaId_nombre_idx" ON "Articulo"("empresaId", "nombre");

-- CreateIndex
CREATE INDEX "Stock_articuloId_idx" ON "Stock"("articuloId");

-- CreateIndex
CREATE INDEX "Stock_almacenId_idx" ON "Stock"("almacenId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_articuloId_almacenId_key" ON "Stock"("articuloId", "almacenId");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_activo_idx" ON "Proveedor"("empresaId", "activo");

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
CREATE INDEX "Venta_empresaId_fecha_idx" ON "Venta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Venta_empresaId_estado_idx" ON "Venta"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Venta_empresaId_estadoPago_idx" ON "Venta"("empresaId", "estadoPago");

-- CreateIndex
CREATE INDEX "VentaDetalle_ventaId_idx" ON "VentaDetalle"("ventaId");

-- CreateIndex
CREATE INDEX "VentaDetalle_articuloId_idx" ON "VentaDetalle"("articuloId");

-- CreateIndex
CREATE INDEX "PagoCompra_compraId_idx" ON "PagoCompra"("compraId");

-- CreateIndex
CREATE INDEX "PagoCompra_empresaId_fecha_idx" ON "PagoCompra"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "PagoVenta_ventaId_idx" ON "PagoVenta"("ventaId");

-- CreateIndex
CREATE INDEX "PagoVenta_empresaId_fecha_idx" ON "PagoVenta"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "Caja_empresaId_idx" ON "Caja"("empresaId");

-- CreateIndex
CREATE INDEX "AperturaCaja_cajaId_idx" ON "AperturaCaja"("cajaId");

-- CreateIndex
CREATE INDEX "AperturaCaja_empresaId_idx" ON "AperturaCaja"("empresaId");

-- CreateIndex
CREATE INDEX "AperturaCaja_estado_idx" ON "AperturaCaja"("estado");

-- CreateIndex
CREATE INDEX "MovimientoCaja_aperturaCajaId_idx" ON "MovimientoCaja"("aperturaCajaId");

-- CreateIndex
CREATE INDEX "MovimientoCaja_empresaId_idx" ON "MovimientoCaja"("empresaId");

-- CreateIndex
CREATE INDEX "Auditoria_empresaId_idx" ON "Auditoria"("empresaId");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_modulo_idx" ON "Auditoria"("modulo");

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt");

-- CreateIndex
CREATE INDEX "CuentaBancaria_empresaId_idx" ON "CuentaBancaria"("empresaId");

-- CreateIndex
CREATE INDEX "Cheque_empresaId_idx" ON "Cheque"("empresaId");

-- CreateIndex
CREATE INDEX "Cheque_estado_idx" ON "Cheque"("estado");

-- CreateIndex
CREATE INDEX "Cheque_fechaPago_idx" ON "Cheque"("fechaPago");

-- CreateIndex
CREATE INDEX "MovimientoBancario_cuentaId_idx" ON "MovimientoBancario"("cuentaId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_empresaId_idx" ON "MovimientoBancario"("empresaId");

-- CreateIndex
CREATE INDEX "MovimientoBancario_fecha_idx" ON "MovimientoBancario"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoBancario_conciliacionId_idx" ON "MovimientoBancario"("conciliacionId");

-- CreateIndex
CREATE INDEX "ConciliacionBancaria_empresaId_idx" ON "ConciliacionBancaria"("empresaId");

-- CreateIndex
CREATE INDEX "ConciliacionBancaria_cuentaId_idx" ON "ConciliacionBancaria"("cuentaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConciliacionBancaria_empresaId_cuentaId_periodo_key" ON "ConciliacionBancaria"("empresaId", "cuentaId", "periodo");

-- CreateIndex
CREATE INDEX "AjusteConciliacion_conciliacionId_idx" ON "AjusteConciliacion"("conciliacionId");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Almacen" ADD CONSTRAINT "Almacen_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_almacenId_fkey" FOREIGN KEY ("almacenId") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_condicionPagoId_fkey" FOREIGN KEY ("condicionPagoId") REFERENCES "CondicionPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoCompra" ADD CONSTRAINT "NotaCreditoCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoCompraDetalle" ADD CONSTRAINT "NotaCreditoCompraDetalle_notaCreditoCompraId_fkey" FOREIGN KEY ("notaCreditoCompraId") REFERENCES "NotaCreditoCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_condicionPagoId_fkey" FOREIGN KEY ("condicionPagoId") REFERENCES "CondicionPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_timbradoId_fkey" FOREIGN KEY ("timbradoId") REFERENCES "Timbrado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_impuestoId_fkey" FOREIGN KEY ("impuestoId") REFERENCES "Impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoVenta" ADD CONSTRAINT "NotaCreditoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCreditoVentaDetalle" ADD CONSTRAINT "NotaCreditoVentaDetalle_notaCreditoVentaId_fkey" FOREIGN KEY ("notaCreditoVentaId") REFERENCES "NotaCreditoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timbrado" ADD CONSTRAINT "Timbrado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCompra" ADD CONSTRAINT "PagoCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCompra" ADD CONSTRAINT "PagoCompra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AperturaCaja" ADD CONSTRAINT "AperturaCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AperturaCaja" ADD CONSTRAINT "AperturaCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AperturaCaja" ADD CONSTRAINT "AperturaCaja_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AperturaCaja" ADD CONSTRAINT "AperturaCaja_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_aperturaCajaId_fkey" FOREIGN KEY ("aperturaCajaId") REFERENCES "AperturaCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_monedaId_fkey" FOREIGN KEY ("monedaId") REFERENCES "Moneda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "Cheque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoBancario" ADD CONSTRAINT "MovimientoBancario_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "ConciliacionBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciliacionBancaria" ADD CONSTRAINT "ConciliacionBancaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciliacionBancaria" ADD CONSTRAINT "ConciliacionBancaria_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteConciliacion" ADD CONSTRAINT "AjusteConciliacion_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "ConciliacionBancaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
