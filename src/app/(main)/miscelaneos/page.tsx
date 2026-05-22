/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  Percent,
  DollarSign,
  CreditCard,
  CalendarRange,
  Users,
  FileCheck,
  Landmark,
  Banknote,
} from "lucide-react";

const ITEMS = [
  {
    href: "/miscelaneos/almacenes",
    icon: Building2,
    titulo: "Almacenes",
    descripcion: "Gestioná los depósitos y almacenes de tu empresa.",
  },
  {
    href: "/miscelaneos/impuestos",
    icon: Percent,
    titulo: "Impuestos",
    descripcion: "Configurá las tasas de IVA y otros impuestos.",
  },
  {
    href: "/miscelaneos/monedas",
    icon: DollarSign,
    titulo: "Monedas y Tipos de Cambio",
    descripcion: "Administrá las monedas y el tipo de cambio del día.",
  },
  {
    href: "/miscelaneos/condiciones-pago",
    icon: CreditCard,
    titulo: "Condiciones de Pago",
    descripcion: "Definí condiciones de pago: contado, crédito 30 días, etc.",
  },
  {
    href: "/miscelaneos/periodos",
    icon: CalendarRange,
    titulo: "Períodos Contables",
    descripcion: "Abrí y cerrá períodos para controlar las fechas operativas.",
  },
  {
    href: "/miscelaneos/usuarios",
    icon: Users,
    titulo: "Usuarios",
    descripcion: "Administrá los usuarios y sus roles de acceso al sistema.",
  },
  {
    href: "/miscelaneos/timbrados",
    icon: FileCheck,
    titulo: "Timbrados",
    descripcion: "Configurá los timbrados de la SET con serie y numeración.",
  },
  {
    href: "/miscelaneos/cajas",
    icon: Landmark,
    titulo: "Cajas",
    descripcion: "Configurá las cajas para el módulo de tesorería.",
  },
  {
    href: "/miscelaneos/bancos",
    icon: Banknote,
    titulo: "Bancos",
    descripcion: "Configurá los bancos disponibles en el sistema.",
  },
];

export default function MiscelaneosPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const colorPrimario = user?.colorPrimario || "#1E3A5F";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Parámetros del Sistema
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configuración general del sistema
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ITEMS.map(({ href, icon: Icon, titulo, descripcion }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: `${colorPrimario}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: colorPrimario }} />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              {titulo}
            </h2>
            <p className="text-xs text-gray-500">{descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
