/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

const IMPUESTOS_DEFAULT = [
  { nombre: "IVA 10%", porcentaje: 10, checked: true },
  { nombre: "IVA 5%", porcentaje: 5, checked: true },
  { nombre: "Exenta", porcentaje: 0, checked: true },
];

const CONDICIONES_DEFAULT = [
  { nombre: "Contado", dias: 0, checked: true },
  { nombre: "Crédito 30 días", dias: 30, checked: true },
  { nombre: "Crédito 60 días", dias: 60, checked: false },
  { nombre: "Crédito 90 días", dias: 90, checked: false },
];

const MONEDAS_DEFAULT = [
  {
    codigo: "PYG",
    nombre: "Guaraní",
    simbolo: "Gs.",
    principal: true,
    checked: true,
  },
  {
    codigo: "USD",
    nombre: "Dólar americano",
    simbolo: "$",
    principal: false,
    checked: false,
  },
  {
    codigo: "BRL",
    nombre: "Real brasileño",
    simbolo: "R$",
    principal: false,
    checked: false,
  },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const colorPrimario = user?.colorPrimario || "#1E3A5F";
  const colorSecundario = user?.colorSecundario || "#2E6DA4";
  const empresaNombre = user?.empresaNombre || "Mi Empresa";

  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const TOTAL_PASOS = 6;

  // Estados de cada paso
  const [almacen, setAlmacen] = useState("Almacén Principal");
  const [monedas, setMonedas] = useState(MONEDAS_DEFAULT);
  const [impuestos, setImpuestos] = useState(IMPUESTOS_DEFAULT);
  const [condiciones, setCondiciones] = useState(CONDICIONES_DEFAULT);
  const [timbrado, setTimbrado] = useState({
    numero: "",
    serie1: "001",
    serie2: "001",
    desde: "1",
    hasta: "9999999",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaVencimiento: "",
    skipTimbrado: false,
  });

  async function finalizar() {
    setGuardando(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      monedas: monedas.filter((m) => m.checked),
      impuestos: impuestos.filter((i) => i.checked),
      condiciones: condiciones.filter((c) => c.checked),
      almacen,
    };

    if (
      !timbrado.skipTimbrado &&
      timbrado.numero &&
      timbrado.fechaVencimiento
    ) {
      body.timbrado = timbrado;
    }

    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    window.location.href = "/dashboard"
  }

  const progressPct = ((paso - 1) / (TOTAL_PASOS - 1)) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: colorPrimario }}
              >
                {empresaNombre[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {empresaNombre}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              Paso {paso} de {TOTAL_PASOS}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: colorPrimario,
              }}
            />
          </div>
        </div>

        <div className="p-6">
          {/* ── PASO 1: Bienvenida ── */}
          {paso === 1 && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
                style={{ backgroundColor: colorPrimario }}
              >
                🎉
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Bienvenido a GestPy!
              </h2>
              <p className="text-gray-500 mb-6">
                Vamos a configurar <strong>{empresaNombre}</strong> en menos de
                2 minutos para que puedas empezar a gestionar tu negocio.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                {[
                  "Configurar monedas",
                  "Configurar impuestos",
                  "Configurar condiciones de pago",
                  "Nombrar tu almacén",
                  "Configurar timbrado (opcional)",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 2: Monedas ── */}
          {paso === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Monedas</h2>
              <p className="text-gray-500 text-sm mb-5">
                Seleccioná las monedas que usará tu empresa
              </p>
              <div className="space-y-3">
                {monedas.map((m, i) => (
                  <label
                    key={m.codigo}
                    className="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={
                      m.checked
                        ? {
                            borderColor: colorPrimario,
                            backgroundColor: `${colorPrimario}08`,
                          }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={m.checked}
                        onChange={(e) => {
                          const updated = [...monedas];
                          updated[i] = { ...m, checked: e.target.checked };
                          // PYG siempre checked
                          if (m.codigo === "PYG") return;
                          setMonedas(updated);
                        }}
                        className="w-4 h-4 rounded"
                        disabled={m.codigo === "PYG"}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {m.nombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          {m.codigo} — {m.simbolo}
                        </p>
                      </div>
                    </div>
                    {m.principal && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${colorPrimario}15`,
                          color: colorPrimario,
                        }}
                      >
                        Principal
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 3: Impuestos ── */}
          {paso === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Impuestos
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Seleccioná los impuestos que aplicará tu empresa
              </p>
              <div className="space-y-3">
                {impuestos.map((imp, i) => (
                  <label
                    key={imp.nombre}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={
                      imp.checked
                        ? {
                            borderColor: colorPrimario,
                            backgroundColor: `${colorPrimario}08`,
                          }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    <input
                      type="checkbox"
                      checked={imp.checked}
                      onChange={(e) => {
                        const updated = [...impuestos];
                        updated[i] = { ...imp, checked: e.target.checked };
                        setImpuestos(updated);
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {imp.nombre}
                      </p>
                      <p className="text-xs text-gray-400">{imp.porcentaje}%</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 4: Condiciones de pago ── */}
          {paso === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Condiciones de pago
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Seleccioná las condiciones que usarás
              </p>
              <div className="space-y-3">
                {condiciones.map((c, i) => (
                  <label
                    key={c.nombre}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={
                      c.checked
                        ? {
                            borderColor: colorPrimario,
                            backgroundColor: `${colorPrimario}08`,
                          }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    <input
                      type="checkbox"
                      checked={c.checked}
                      onChange={(e) => {
                        const updated = [...condiciones];
                        updated[i] = { ...c, checked: e.target.checked };
                        setCondiciones(updated);
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.dias === 0
                          ? "Pago inmediato"
                          : `${c.dias} días para pagar`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 5: Almacén ── */}
          {paso === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Almacén principal
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Se creó un almacén por defecto. Podés cambiarle el nombre si
                querés.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre del almacén
                </label>
                <input
                  value={almacen}
                  onChange={(e) => setAlmacen(e.target.value)}
                  placeholder="Ej: Depósito Central"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                <p className="text-blue-700 text-xs">
                  💡 Podés crear más almacenes después en{" "}
                  <strong>Parámetros → Almacenes</strong>
                </p>
              </div>
            </div>
          )}

          {/* ── PASO 6: Timbrado ── */}
          {paso === 6 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Timbrado SET
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Configurá tu timbrado para emitir facturas. Podés hacerlo ahora
                o más tarde.
              </p>

              <label
                className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-4"
                style={
                  timbrado.skipTimbrado
                    ? { borderColor: "#e5e7eb" }
                    : {
                        borderColor: colorPrimario,
                        backgroundColor: `${colorPrimario}08`,
                      }
                }
              >
                <input
                  type="checkbox"
                  checked={!timbrado.skipTimbrado}
                  onChange={(e) =>
                    setTimbrado({
                      ...timbrado,
                      skipTimbrado: !e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Configurar timbrado ahora
                  </p>
                  <p className="text-xs text-gray-400">
                    Recomendado para empezar a facturar
                  </p>
                </div>
              </label>

              {!timbrado.skipTimbrado && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Número de timbrado *
                    </label>
                    <input
                      value={timbrado.numero}
                      onChange={(e) =>
                        setTimbrado({ ...timbrado, numero: e.target.value })
                      }
                      placeholder="Ej: 12345678"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Serie
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={timbrado.serie1}
                        maxLength={3}
                        onChange={(e) =>
                          setTimbrado({ ...timbrado, serie1: e.target.value })
                        }
                        className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                      <span className="text-gray-400 font-bold">—</span>
                      <input
                        value={timbrado.serie2}
                        maxLength={3}
                        onChange={(e) =>
                          setTimbrado({ ...timbrado, serie2: e.target.value })
                        }
                        className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 text-center font-mono focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha inicio
                      </label>
                      <input
                        type="date"
                        value={timbrado.fechaInicio}
                        onChange={(e) =>
                          setTimbrado({
                            ...timbrado,
                            fechaInicio: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fecha vencimiento
                      </label>
                      <input
                        type="date"
                        value={timbrado.fechaVencimiento}
                        onChange={(e) =>
                          setTimbrado({
                            ...timbrado,
                            fechaVencimiento: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {timbrado.serie1 && timbrado.serie2 && timbrado.desde && (
                    <p className="text-xs" style={{ color: colorPrimario }}>
                      Primera factura: {timbrado.serie1.padStart(3, "0")}-
                      {timbrado.serie2.padStart(3, "0")}-
                      {String(parseInt(timbrado.desde) || 1).padStart(7, "0")}
                    </p>
                  )}
                </div>
              )}

              {timbrado.skipTimbrado && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <p className="text-yellow-700 text-xs">
                    ⚠️ Podés configurar el timbrado después en{" "}
                    <strong>Parámetros → Timbrados</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 pb-6 flex gap-3">
          {paso > 1 && (
            <button
              onClick={() => setPaso(paso - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          )}

          {paso < TOTAL_PASOS ? (
            <button
              onClick={() => setPaso(paso + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: colorPrimario }}
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: colorPrimario }}
            >
              {guardando ? (
                "Configurando..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ¡Listo! Ir al dashboard
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
