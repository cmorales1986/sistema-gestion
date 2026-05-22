/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

type Cliente = { id: string; nombre: string };
type Almacen = { id: string; nombre: string };
type Articulo = {
  id: string;
  codigo: string | null;
  nombre: string;
  unidadMedida: string;
  impuestoId: string | null;
  precioVenta: number | null;
};
type CondicionPago = { id: string; nombre: string; dias: number };
type Moneda = {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  principal: boolean;
};
type Impuesto = { id: string; nombre: string; porcentaje: number };
type Timbrado = {
  id: string;
  numero: string;
  serie1: string;
  serie2: string;
  siguiente: number;
  hasta: number;
};

type DetalleForm = {
  articuloId: string;
  nombreArticulo: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  impuestoId: string;
  porcentajeIva: number;
  subtotal: number;
};

const TIPOS_COMPROBANTE = ["FACTURA", "TICKET", "RECIBO", "NOTA_PEDIDO"];

function formatGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}
function calcSubtotal(cantidad: number, precio: number, descuento: number) {
  return cantidad * precio * (1 - descuento / 100);
}
function calcIVA(subtotal: number, pct: number) {
  if (pct === 5) return subtotal / 21;
  if (pct === 10) return subtotal / 11;
  return 0;
}

export default function NuevaVentaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const colorPrimario = user?.colorPrimario || "#1E3A5F";
  const colorSecundario = user?.colorSecundario || "#2E6DA4";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [condiciones, setCondiciones] = useState<CondicionPago[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [articulosBusq, setArticulosBusq] = useState<Articulo[]>([]);
  const [busqArticulo, setBusqArticulo] = useState("");
  const [showBusq, setShowBusq] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [timbrado, setTimbrado] = useState<Timbrado | null>(null);

  const [cabecera, setCabecera] = useState({
    clienteId: "",
    almacenId: "",
    fecha: new Date().toISOString().split("T")[0],
    nroComprobante: "",
    tipoComprobante: "FACTURA",
    condicionPagoId: "",
    monedaId: "",
    tipoCambio: 1,
    descuento: 0,
    observacion: "",
  });

  const [detalles, setDetalles] = useState<DetalleForm[]>([]);

  const [showModalCobro, setShowModalCobro] = useState(false);
  const [ventaCreada, setVentaCreada] = useState<{
    id: string;
    total: number;
    nroComprobante: string | null;
  } | null>(null);
  const [formCobro, setFormCobro] = useState({
    medioPago: "EFECTIVO",
    nroReferencia: "",
    observacion: "",
  });
  const [guardandoCobro, setGuardandoCobro] = useState(false);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then(setClientes);
    fetch("/api/almacenes")
      .then((r) => r.json())
      .then(setAlmacenes);
    fetch("/api/condiciones-pago")
      .then((r) => r.json())
      .then(setCondiciones);
    fetch("/api/monedas")
      .then((r) => r.json())
      .then((data) => {
        setMonedas(data);
        const principal = data.find((m: Moneda) => m.principal);
        if (principal)
          setCabecera((prev) => ({ ...prev, monedaId: principal.id }));
      });
    fetch("/api/impuestos")
      .then((r) => r.json())
      .then(setImpuestos);
  }, []);

  // Timbrado en useEffect separado
  useEffect(() => {
    fetch("/api/timbrados/activo")
      .then((r) => r.json())
      .then((data) => {
        if (data.timbrado && data.nroFormateado) {
          setTimbrado(data.timbrado);
          setCabecera((prev) => ({
            ...prev,
            nroComprobante: data.nroFormateado,
          }));
        }
      });
  }, []);

  useEffect(() => {
    if (busqArticulo.length < 1) {
      setArticulosBusq([]);
      return;
    }
    fetch(`/api/articulos?q=${busqArticulo}`)
      .then((r) => r.json())
      .then(setArticulosBusq);
  }, [busqArticulo]);

  function agregarArticulo(a: Articulo) {
    const impuesto = impuestos.find((i) => i.id === a.impuestoId);
    setDetalles((prev) => [
      ...prev,
      {
        articuloId: a.id,
        nombreArticulo: a.nombre,
        unidadMedida: a.unidadMedida,
        cantidad: 1,
        precioUnitario: a.precioVenta || 0,
        descuento: 0,
        impuestoId: a.impuestoId || "",
        porcentajeIva: impuesto?.porcentaje || 0,
        subtotal: a.precioVenta || 0,
      },
    ]);
    setBusqArticulo("");
    setShowBusq(false);
  }

  function actualizarDetalle(
    idx: number,
    campo: string,
    valor: number | string,
  ) {
    setDetalles((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const nuevo = { ...d, [campo]: valor };
        if (campo === "impuestoId") {
          const imp = impuestos.find((im) => im.id === valor);
          nuevo.porcentajeIva = imp?.porcentaje || 0;
        }
        nuevo.subtotal = calcSubtotal(
          Number(nuevo.cantidad),
          Number(nuevo.precioUnitario),
          Number(nuevo.descuento),
        );
        return nuevo;
      }),
    );
  }

  function eliminarDetalle(idx: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotalBruto = detalles.reduce((a, d) => a + d.subtotal, 0);
  const descuentoMonto = subtotalBruto * (cabecera.descuento / 100);
  const subtotalNeto = subtotalBruto - descuentoMonto;
  const totalIva5 = detalles
    .filter((d) => d.porcentajeIva === 5)
    .reduce((a, d) => a + calcIVA(d.subtotal, 5), 0);
  const totalIva10 = detalles
    .filter((d) => d.porcentajeIva === 10)
    .reduce((a, d) => a + calcIVA(d.subtotal, 10), 0);
  const total = subtotalNeto;
  const monedaSeleccionada = monedas.find((m) => m.id === cabecera.monedaId);

  async function guardar(estado: "BORRADOR" | "CONFIRMADA") {
    if (!cabecera.clienteId) {
      setError("Seleccioná un cliente");
      return;
    }
    if (!cabecera.almacenId) {
      setError("Seleccioná un almacén");
      return;
    }
    if (estado === "CONFIRMADA" && !cabecera.nroComprobante.trim()) {
      setError("El número de comprobante es requerido para confirmar");
      return;
    }
    if (detalles.length === 0) {
      setError("Agregá al menos un artículo");
      return;
    }

    setGuardando(true);
    setError("");

    const res = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...cabecera,
        timbradoId: timbrado?.id || null,
        estado,
        subtotal: subtotalNeto,
        total,
        detalles: detalles.map((d) => ({
          articuloId: d.articuloId,
          impuestoId: d.impuestoId || null,
          porcentajeIva: d.porcentajeIva,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuento: d.descuento,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();

      // Si es contado y confirmada → abrir modal de cobro
      const condicion = condiciones.find(
        (c) => c.id === cabecera.condicionPagoId,
      );
      if (estado === "CONFIRMADA" && condicion && condicion.dias === 0) {
        setVentaCreada({
          id: data.id,
          total: data.total,
          nroComprobante: data.nroComprobante,
        });
        setShowModalCobro(true);
        setGuardando(false);
        return;
      }

      router.push("/ventas");
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
    }
    setGuardando(false);
  }

  async function registrarCobro() {
    if (!ventaCreada) return;
    setGuardandoCobro(true);

    const res = await fetch("/api/ventas/cobros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ventaId: ventaCreada.id,
        fecha: new Date().toISOString().split("T")[0],
        monto: ventaCreada.total,
        medioPago: formCobro.medioPago,
        nroReferencia: formCobro.nroReferencia || null,
        observacion: formCobro.observacion || null,
      }),
    });

    if (res.ok) {
      router.push("/ventas");
    } else {
      const data = await res.json();
      setError(data.error || "Error al registrar cobro");
    }
    setGuardandoCobro(false);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/ventas"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva venta</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Registrá una factura de venta
          </p>
        </div>
      </div>

      {/* Warning si no hay timbrado */}
      {!timbrado && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-orange-700 text-sm">
            ⚠️ No hay timbrado activo. Configuralo en{" "}
            <Link
              href="/miscelaneos/timbrados"
              className="font-medium underline"
            >
              Parámetros → Timbrados
            </Link>{" "}
            para generar números de comprobante automáticamente.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* CABECERA */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Datos del comprobante
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <div className="relative">
                <select
                  value={cabecera.clienteId}
                  onChange={(e) =>
                    setCabecera({ ...cabecera, clienteId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                >
                  <option value="">Seleccioná un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={cabecera.fecha}
                onChange={(e) =>
                  setCabecera({ ...cabecera, fecha: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo comprobante
              </label>
              <div className="relative">
                <select
                  value={cabecera.tipoComprobante}
                  onChange={(e) =>
                    setCabecera({
                      ...cabecera,
                      tipoComprobante: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                >
                  {TIPOS_COMPROBANTE.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nro. comprobante *
                {timbrado && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    — timbrado {timbrado.numero}
                  </span>
                )}
              </label>
              <input
                value={cabecera.nroComprobante}
                onChange={(e) =>
                  setCabecera({ ...cabecera, nroComprobante: e.target.value })
                }
                placeholder="001-001-0000001"
                readOnly={!!timbrado}
                className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent ${
                  timbrado ? "bg-gray-50 text-gray-600" : "text-gray-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Almacén *
              </label>
              <div className="relative">
                <select
                  value={cabecera.almacenId}
                  onChange={(e) =>
                    setCabecera({ ...cabecera, almacenId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                >
                  <option value="">Seleccioná un almacén</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condición de pago
              </label>
              <div className="relative">
                <select
                  value={cabecera.condicionPagoId}
                  onChange={(e) =>
                    setCabecera({
                      ...cabecera,
                      condicionPagoId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                >
                  <option value="">Seleccioná condición</option>
                  {condiciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <div className="relative">
                <select
                  value={cabecera.monedaId}
                  onChange={(e) =>
                    setCabecera({ ...cabecera, monedaId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                >
                  <option value="">Seleccioná moneda</option>
                  {monedas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo} — {m.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {monedaSeleccionada && !monedaSeleccionada.principal && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de cambio (Gs. por 1 {monedaSeleccionada.codigo})
                </label>
                <input
                  type="number"
                  value={cabecera.tipoCambio}
                  onChange={(e) =>
                    setCabecera({
                      ...cabecera,
                      tipoCambio: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
            )}

            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Observación
              </label>
              <input
                value={cabecera.observacion}
                onChange={(e) =>
                  setCabecera({ ...cabecera, observacion: e.target.value })
                }
                placeholder="Observaciones opcionales"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* ÍTEMS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Ítems</h2>
            <div className="relative">
              <button
                onClick={() => setShowBusq(!showBusq)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: colorPrimario }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = colorSecundario)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = colorPrimario)
                }
              >
                <Plus className="w-4 h-4" /> Agregar ítem
              </button>
              {showBusq && (
                <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-80">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        autoFocus
                        value={busqArticulo}
                        onChange={(e) => setBusqArticulo(e.target.value)}
                        placeholder="Buscar artículo..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {articulosBusq.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        {busqArticulo
                          ? "Sin resultados"
                          : "Escribí para buscar"}
                      </p>
                    ) : (
                      articulosBusq.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => agregarArticulo(a)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {a.nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            {a.codigo} · {a.unidadMedida}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {detalles.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">No hay ítems agregados</p>
              <p className="text-xs mt-1">
                Hacé click en "Agregar ítem" para empezar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 pb-2">
                      Artículo
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 w-24">
                      Cantidad
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 w-32">
                      Precio unit.
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 w-20">
                      Desc. %
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 pb-2 w-32 pl-3">
                      Impuesto
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 pb-2 w-32">
                      Subtotal
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <p className="text-sm font-medium text-gray-900">
                          {d.nombreArticulo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {d.unidadMedida}
                        </p>
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={d.cantidad}
                          onChange={(e) =>
                            actualizarDetalle(
                              i,
                              "cantidad",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full text-right px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={d.precioUnitario}
                          onChange={(e) =>
                            actualizarDetalle(
                              i,
                              "precioUnitario",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full text-right px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={d.descuento}
                          onChange={(e) =>
                            actualizarDetalle(
                              i,
                              "descuento",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full text-right px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                        />
                      </td>
                      <td className="py-2 px-1 pl-3">
                        <select
                          value={d.impuestoId}
                          onChange={(e) =>
                            actualizarDetalle(i, "impuestoId", e.target.value)
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none appearance-none"
                        >
                          <option value="">Sin impuesto</option>
                          {impuestos.map((imp) => (
                            <option key={imp.id} value={imp.id}>
                              {imp.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-1 text-right text-sm font-medium text-gray-900">
                        {monedaSeleccionada?.simbolo || "Gs."}{" "}
                        {formatGs(d.subtotal)}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          onClick={() => eliminarDetalle(i)}
                          className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TOTALES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>
                  {monedaSeleccionada?.simbolo || "Gs."}{" "}
                  {formatGs(subtotalBruto)}
                </span>
              </div>
              {totalIva5 > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA 5%</span>
                  <span>Gs. {formatGs(totalIva5)}</span>
                </div>
              )}
              {totalIva10 > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA 10%</span>
                  <span>Gs. {formatGs(totalIva10)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Descuento general</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cabecera.descuento}
                    onChange={(e) =>
                      setCabecera({
                        ...cabecera,
                        descuento: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-14 text-center px-1 py-0.5 rounded border border-gray-200 text-xs"
                  />
                  <span className="text-xs">%</span>
                </div>
                {descuentoMonto > 0 && (
                  <span className="text-red-500">
                    - Gs. {formatGs(descuentoMonto)}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>
                  {monedaSeleccionada?.simbolo || "Gs."} {formatGs(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end pb-6">
          <Link
            href="/ventas"
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={() => guardar("BORRADOR")}
            disabled={guardando}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors disabled:opacity-50"
            style={{ borderColor: colorPrimario, color: colorPrimario }}
          >
            Guardar borrador
          </button>
          <button
            onClick={() => guardar("CONFIRMADA")}
            disabled={guardando}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: colorPrimario }}
          >
            {guardando ? "Guardando..." : "Confirmar venta"}
          </button>
        </div>
      </div>
      {/* ── MODAL COBRO CONTADO ── */}
      {showModalCobro && ventaCreada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Registrar cobro
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Factura {ventaCreada.nroComprobante || "—"} —{" "}
                <span className="font-semibold text-gray-900">
                  Gs. {new Intl.NumberFormat("es-PY").format(ventaCreada.total)}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Medio de pago */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Medio de cobro *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "EFECTIVO",
                    "CHEQUE",
                    "TRANSFERENCIA",
                    "TARJETA",
                    "OTRO",
                  ].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setFormCobro({ ...formCobro, medioPago: m })
                      }
                      className="py-2 rounded-lg text-xs font-medium border-2 transition-all"
                      style={
                        formCobro.medioPago === m
                          ? {
                              borderColor: colorPrimario,
                              backgroundColor: `${colorPrimario}10`,
                              color: colorPrimario,
                            }
                          : { borderColor: "#e5e7eb", color: "#6b7280" }
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nro referencia si aplica */}
              {(formCobro.medioPago === "CHEQUE" ||
                formCobro.medioPago === "TRANSFERENCIA") && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {formCobro.medioPago === "CHEQUE"
                      ? "Nro. de cheque"
                      : "Nro. de transferencia"}
                  </label>
                  <input
                    value={formCobro.nroReferencia}
                    onChange={(e) =>
                      setFormCobro({
                        ...formCobro,
                        nroReferencia: e.target.value,
                      })
                    }
                    placeholder={
                      formCobro.medioPago === "CHEQUE" ? "000123" : "REF-123456"
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                </div>
              )}

              {/* Observacion */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observación
                </label>
                <input
                  value={formCobro.observacion}
                  onChange={(e) =>
                    setFormCobro({ ...formCobro, observacion: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              {/* Info caja */}
              {formCobro.medioPago === "EFECTIVO" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-blue-700 text-xs">
                    💡 Si hay una caja abierta, este cobro se registrará
                    automáticamente como ingreso.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push("/ventas")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Omitir
              </button>
              <button
                onClick={registrarCobro}
                disabled={guardandoCobro}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: colorPrimario }}
              >
                {guardandoCobro ? "Registrando..." : "Confirmar cobro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
