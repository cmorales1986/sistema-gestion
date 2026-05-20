"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";

type Plan = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
};

const COLORES_PRESET = [
  { primario: "#1E3A5F", secundario: "#2E6DA4", label: "Azul oscuro" },
  { primario: "#1a5c38", secundario: "#2d9e63", label: "Verde" },
  { primario: "#7c1d1d", secundario: "#c0392b", label: "Rojo" },
  { primario: "#4a1a6b", secundario: "#8e44ad", label: "Violeta" },
  { primario: "#1a4a6b", secundario: "#2980b9", label: "Celeste" },
  { primario: "#5c4a1a", secundario: "#d4a017", label: "Dorado" },
  { primario: "#b8860b", secundario: "#f0c040", label: "Amarillo" },
  { primario: "#c45c00", secundario: "#e07b20", label: "Naranja" },
  { primario: "#1a6b6b", secundario: "#20a0a0", label: "Teal" },
  { primario: "#2d2d2d", secundario: "#555555", label: "Gris oscuro" },
  { primario: "#6b1a3a", secundario: "#a02060", label: "Rosa" },
  { primario: "#1a3a1a", secundario: "#3a6b3a", label: "Verde oscuro" },
];

export default function RegistroPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    empresaNombre: "",
    planId: "",
    adminNombre: "",
    adminEmail: "",
    adminPassword: "",
    colorPrimario: "#1E3A5F",
    colorSecundario: "#2E6DA4",
    logoUrl: "",
  });

  useEffect(() => {
    fetch("/api/planes")
      .then((r) => r.json())
      .then(setPlanes);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function seleccionarColor(primario: string, secundario: string) {
    setForm({ ...form, colorPrimario: primario, colorSecundario: secundario });
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 1MB
    if (file.size > 1024 * 1024) {
      setError("El logo no debe superar 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setForm({ ...form, logoUrl: base64 });
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoPreview(null);
    setForm({ ...form, logoUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatPrecio(precio: number) {
    return new Intl.NumberFormat("es-PY").format(precio);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al registrar");
      setLoading(false);
      return;
    }

    try {
      await signIn("credentials", {
        email: form.adminEmail,
        password: form.adminPassword,
        redirect: false,
      });
      window.location.href = "/dashboard";
    } catch {
      // igual redirigimos, el login fue exitoso
      window.location.href = "/login";
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 overflow-hidden"
          style={{
            backgroundColor: logoPreview ? "transparent" : form.colorPrimario,
          }}
        >
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt="Logo"
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-white text-2xl font-bold">
              {form.empresaNombre ? form.empresaNombre[0].toUpperCase() : "G"}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Registrá tu empresa
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {paso === 1
            ? "Paso 1 de 2 — Datos de la empresa"
            : "Paso 2 de 2 — Tu cuenta de administrador"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: paso === 1 ? "50%" : "100%",
            backgroundColor: form.colorPrimario,
          }}
        />
      </div>

      <form
        onSubmit={
          paso === 1
            ? (e) => {
                e.preventDefault();
                setError("");
                setPaso(2);
              }
            : handleSubmit
        }
      >
        {/* ── PASO 1 ── */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la empresa
              </label>
              <input
                name="empresaNombre"
                value={form.empresaNombre}
                onChange={handleChange}
                required
                placeholder="Ej: Fuel Oil S.A."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo de la empresa{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              {logoPreview ? (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 font-medium truncate">
                      Logo cargado
                    </p>
                    <p className="text-xs text-gray-400">
                      Se mostrará en el sistema
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all flex flex-col items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Subir logo</span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG hasta 1MB
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogo}
                className="hidden"
              />
            </div>

            {/* Planes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elegí tu plan
              </label>
              <div className="space-y-2">
                {planes.map((plan) => (
                  <label
                    key={plan.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all"
                    style={
                      form.planId === plan.id
                        ? {
                            borderColor: form.colorPrimario,
                            backgroundColor: `${form.colorPrimario}10`,
                          }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    <input
                      type="radio"
                      name="planId"
                      value={plan.id}
                      checked={form.planId === plan.id}
                      onChange={handleChange}
                      className="hidden"
                      required
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {plan.nombre}
                      </p>
                      {plan.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {plan.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-gray-900 text-sm">
                        Gs. {formatPrecio(plan.precio)}
                      </p>
                      <p className="text-xs text-gray-500">/ mes</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Colores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de tu marca
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORES_PRESET.map((c) => (
                  <button
                    key={c.primario}
                    type="button"
                    onClick={() => seleccionarColor(c.primario, c.secundario)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.colorPrimario === c.primario
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.primario }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!form.empresaNombre || !form.planId}
              className="w-full text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-2"
              style={{ backgroundColor: form.colorPrimario }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── PASO 2 ── */}
        {paso === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu nombre
              </label>
              <input
                name="adminNombre"
                value={form.adminNombre}
                onChange={handleChange}
                required
                placeholder="Nombre completo"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.adminPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: form.colorPrimario }}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium hover:underline"
          style={{ color: form.colorPrimario }}
        >
          Ingresá acá
        </Link>
      </p>
    </div>
  );
}
