/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePlan } from "@/lib/use-plan";
import ModuloBloqueado from "@/components/modulo-bloqueado";
import {
  Plus,
  Banknote,
  CreditCard,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  GitMerge,
} from "lucide-react";
import Link from "next/link";

type CuentaBancaria = {
  id: string;
  nroCuenta: string;
  descripcion: string | null;
  saldoInicial: number;
  saldoActual: number;
  banco: { nombre: string; codigo: string };
  moneda: { codigo: string; simbolo: string } | null;
};

function formatGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}

export default function BancosPage() {
  const { tieneModulo } = usePlan();
  const { data: session } = useSession();
  const user = session?.user as any;
  const colorPrimario = user?.colorPrimario || "#1E3A5F";
  const colorSecundario = user?.colorSecundario || "#2E6DA4";

  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bancos/cuentas");
    setCuentas(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!tieneModulo("BANCOS")) {
    return (
      <ModuloBloqueado
        modulo="Bancos"
        descripcion="Gestioná cuentas bancarias, cheques, depósitos y hacé conciliación bancaria automática."
      />
    );
  }

  const saldoTotal = cuentas.reduce((a, c) => a + c.saldoActual, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bancos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""} bancaria
            {cuentas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/bancos/cuentas/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: colorPrimario }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = colorSecundario)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = colorPrimario)
          }
        >
          <Plus className="w-4 h-4" /> Nueva cuenta
        </Link>
      </div>

      {/* Saldo total */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs text-gray-500 mb-1">Saldo total en bancos</p>
          <p className="text-2xl font-bold text-gray-900">
            Gs. {formatGs(saldoTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/bancos/cheques"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Cheques</p>
            <p className="text-xs text-gray-500">
              Gestión de cheques emitidos y recibidos
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
        <Link
          href="/bancos/movimientos"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Movimientos</p>
            <p className="text-xs text-gray-500">
              Historial de movimientos bancarios
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
        <Link
          href="/bancos/conciliacion"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <GitMerge className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Conciliación</p>
            <p className="text-xs text-gray-500">
              Conciliá extractos con tus registros
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* Cuentas */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Cargando...
        </div>
      ) : cuentas.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Banknote className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">
            No hay cuentas bancarias
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Agregá tu primera cuenta bancaria para empezar
          </p>
          <Link
            href="/bancos/cuentas/nueva"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: colorPrimario }}
          >
            <Plus className="w-4 h-4" /> Nueva cuenta bancaria
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cuentas.map((c) => (
            <Link
              key={c.id}
              href={`/bancos/cuentas/${c.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {c.banco.codigo.slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {c.banco.nombre}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {c.nroCuenta}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>

              {c.descripcion && (
                <p className="text-xs text-gray-500 mb-3">{c.descripcion}</p>
              )}

              <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Saldo actual</p>
                  <p
                    className={`text-xl font-bold ${c.saldoActual >= 0 ? "text-gray-900" : "text-red-600"}`}
                  >
                    {c.moneda?.simbolo || "Gs."} {formatGs(c.saldoActual)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Saldo inicial</p>
                  <p className="text-sm text-gray-500">
                    Gs. {formatGs(c.saldoInicial)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
