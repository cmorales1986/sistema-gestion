/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  RefreshCw,
  Calendar,
  Power,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

type Empresa = {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  colorPrimario: string;
  fechaVencimiento: string;
  createdAt: string;
  plan: { nombre: string; precio: number } | null;
  usuarios: { nombre: string; email: string }[];
};

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  TRIAL: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVO: "bg-green-50 text-green-700 border-green-200",
  SUSPENDIDO: "bg-red-50 text-red-600 border-red-200",
  VENCIDO: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [diasExtra, setDiasExtra] = useState<Record<string, string>>({});

  async function cargar() {
    setLoading(true);
    const res = await fetch("/api/admin/empresas-lista");
    setEmpresas(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    setAccionando(id);
    await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setMenuAbierto(null);
    await cargar();
    setAccionando(null);
  }

  async function extenderVencimiento(id: string) {
    const dias = parseInt(diasExtra[id] || "30");
    if (!dias || dias <= 0) return;
    setAccionando(id);
    await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diasExtra: dias }),
    });
    await cargar();
    setAccionando(null);
    setDiasExtra((prev) => ({ ...prev, [id]: "" }));
  }

  const pendientes = empresas.filter((e) => e.estado === "PENDIENTE");
  const trials = empresas.filter((e) => e.estado === "TRIAL");
  const activos = empresas.filter((e) => e.estado === "ACTIVO");
  const suspendidos = empresas.filter((e) => e.estado === "SUSPENDIDO");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de administración
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {empresas.length} empresas registradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <button
              onClick={cargar}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Pendientes",
              count: pendientes.length,
              color: "text-yellow-600",
              border: "border-yellow-200",
            },
            {
              label: "En trial",
              count: trials.length,
              color: "text-blue-600",
              border: "border-blue-200",
            },
            {
              label: "Activos",
              count: activos.length,
              color: "text-green-600",
              border: "border-green-200",
            },
            {
              label: "Suspendidos",
              count: suspendidos.length,
              color: "text-red-600",
              border: "border-red-200",
            },
          ].map((k) => (
            <div
              key={k.label}
              className={`bg-white rounded-xl border ${k.border} shadow-sm p-4`}
            >
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.count}</p>
            </div>
          ))}
        </div>

        {/* Pendientes destacados */}
        {pendientes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-700">
                Solicitudes pendientes ({pendientes.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pendientes.map((e) => (
                <div
                  key={e.id}
                  className="bg-white rounded-xl border-2 border-yellow-200 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                        style={{
                          backgroundColor: e.colorPrimario || "#1E3A5F",
                        }}
                      >
                        {e.nombre[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{e.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {e.usuarios[0]?.nombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          {e.usuarios[0]?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Solicitado el {formatFecha(e.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cambiarEstado(e.id, "TRIAL")}
                        disabled={accionando === e.id}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => cambiarEstado(e.id, "SUSPENDIDO")}
                        disabled={accionando === e.id}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        ✗ Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Todas las empresas
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Cargando...
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">
                      Empresa
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Administrador
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Plan
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Estado
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Vencimiento
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Extender
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{
                              backgroundColor: e.colorPrimario || "#1E3A5F",
                            }}
                          >
                            {e.nombre[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {e.nombre}
                            </p>
                            <p className="text-xs text-gray-400">{e.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {e.usuarios[0]?.nombre || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {e.usuarios[0]?.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {e.plan?.nombre || "—"}
                        </p>
                        {e.plan && (
                          <p className="text-xs text-gray-400">
                            Gs. {formatGs(e.plan.precio)}/mes
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_STYLE[e.estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                          {e.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatFecha(e.fechaVencimiento)}
                      </td>

                      {/* Extender vencimiento */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={diasExtra[e.id] || ""}
                            onChange={(ev) =>
                              setDiasExtra((prev) => ({
                                ...prev,
                                [e.id]: ev.target.value,
                              }))
                            }
                            placeholder="30"
                            className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-900 text-center focus:outline-none"
                          />
                          <span className="text-xs text-gray-400">días</span>
                          <button
                            onClick={() => extenderVencimiento(e.id)}
                            disabled={accionando === e.id || !diasExtra[e.id]}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-30"
                            title="Extender vencimiento"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Acciones de estado */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuAbierto(menuAbierto === e.id ? null : e.id)
                            }
                            disabled={accionando === e.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Power className="w-3.5 h-3.5" />
                            Estado
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {menuAbierto === e.id && (
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 w-40">
                              {["TRIAL", "ACTIVO", "SUSPENDIDO"].map(
                                (estado) => (
                                  <button
                                    key={estado}
                                    onClick={() => cambiarEstado(e.id, estado)}
                                    disabled={e.estado === estado}
                                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                                      e.estado === estado
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_STYLE[estado]}`}
                                    >
                                      {estado}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
