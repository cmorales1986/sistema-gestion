'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

// ── Hook para animaciones al scrollear ──
function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}

// ── Smooth scroll al hacer click en links del navbar ──
function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function Home() {
  if (process.env.NEXT_PUBLIC_SHOW_LANDING !== 'true') {
    redirect('/login')
  }

  useScrollAnimation()

  return (
    <>
      <style>{`
        /* ── Smooth scroll global ── */
        html { scroll-behavior: smooth; }

        /* ── Estados iniciales de animación ── */
        .scroll-animate {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .scroll-animate.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Delays escalonados para grids ── */
        .scroll-animate.delay-1 { transition-delay: 0.1s; }
        .scroll-animate.delay-2 { transition-delay: 0.2s; }
        .scroll-animate.delay-3 { transition-delay: 0.3s; }
        .scroll-animate.delay-4 { transition-delay: 0.4s; }
        .scroll-animate.delay-5 { transition-delay: 0.5s; }
        .scroll-animate.delay-6 { transition-delay: 0.6s; }

        /* ── Fade desde la izquierda ── */
        .scroll-animate.from-left {
          transform: translateX(-32px);
        }
        .scroll-animate.from-left.animate-in {
          transform: translateX(0);
        }

        /* ── Fade desde la derecha ── */
        .scroll-animate.from-right {
          transform: translateX(32px);
        }
        .scroll-animate.from-right.animate-in {
          transform: translateX(0);
        }

        /* ── Scale up ── */
        .scroll-animate.scale-up {
          transform: scale(0.92);
        }
        .scroll-animate.scale-up.animate-in {
          transform: scale(1);
        }
      `}</style>

      <div className="min-h-screen bg-white">

        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">GestPy</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => smoothScrollTo('features')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Funciones
              </button>
              <button onClick={() => smoothScrollTo('precios')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Precios
              </button>
              <button onClick={() => smoothScrollTo('seguridad')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Seguridad
              </button>
              <button onClick={() => smoothScrollTo('contacto')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Contacto
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Ingresar
              </Link>
              <Link href="/registro"
                className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#2E6DA4] transition-colors">
                Empezar gratis
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#1E3A5F] via-[#1a4a7a] to-[#2E6DA4]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6 border border-white/20">
              🇵🇾 Hecho en Paraguay, para empresas paraguayas
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Gestioná tu negocio<br />
              <span className="text-[#7DD3FC]">sin complicaciones</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
              Compras, ventas, stock e inventario en un solo lugar.
              Ideal para pequeñas y medianas empresas que quieren crecer con orden.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/registro"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#1E3A5F] font-bold text-base hover:bg-gray-100 transition-colors shadow-lg">
                Probá 15 días gratis →
              </Link>
              <button onClick={() => smoothScrollTo('features')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-colors cursor-pointer">
                Ver funciones
              </button>
            </div>
            <p className="text-white/40 text-xs mt-4">Sin tarjeta de crédito · Cancelá cuando quieras</p>
          </div>

          {/* Stats */}
          <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
            {[
              { valor: '15 días', label: 'de prueba gratis' },
              { valor: '100%',    label: 'datos seguros' },
              { valor: '24/7',    label: 'acceso online' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-white/10 border border-white/20">
                <p className="text-2xl font-bold text-white">{s.valor}</p>
                <p className="text-white/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 scroll-animate">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Todo lo que tu negocio necesita</h2>
              <p className="text-gray-500">Un sistema completo para manejar tu empresa día a día</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🛒', titulo: 'Compras y proveedores', desc: 'Registrá facturas de compra, controlá pagos y llevá el historial de tus proveedores al día.', delay: 'delay-1' },
                { icon: '💰', titulo: 'Ventas y clientes', desc: 'Emití facturas, controlá cobros y conocé en tiempo real cuánto te deben tus clientes.', delay: 'delay-2' },
                { icon: '📦', titulo: 'Stock e inventario', desc: 'El stock se actualiza automáticamente con cada compra y venta. Alertas cuando hay poco stock.', delay: 'delay-3' },
                { icon: '📊', titulo: 'Reportes completos', desc: 'Cuentas por cobrar, cuentas por pagar, resultado del mes y inventario valorizado.', delay: 'delay-1' },
                { icon: '🏢', titulo: 'Multi-empresa', desc: 'Manejá varias empresas desde una sola cuenta. Ideal para contadores y grupos empresariales.', delay: 'delay-2' },
                { icon: '🧾', titulo: 'Timbrado SET', desc: 'Configurá tu timbrado de la SET con numeración automática para tus facturas de venta.', delay: 'delay-3' },
                { icon: '💳', titulo: 'Pagos y cobros', desc: 'Registrá pagos en efectivo, cheque, transferencia o tarjeta. Saldo actualizado al instante.', delay: 'delay-1' },
                { icon: '📱', titulo: 'Acceso desde cualquier lugar', desc: 'Sistema 100% online. Accedé desde tu celular, tablet o computadora sin instalar nada.', delay: 'delay-2' },
                { icon: '📤', titulo: 'Exportar a Excel', desc: 'Exportá todos tus reportes a Excel con un clic para compartir o analizar en detalle.', delay: 'delay-3' },
              ].map(f => (
                <div key={f.titulo} className={`scroll-animate ${f.delay} bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#2E6DA4] hover:shadow-md transition-all`}>
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.titulo}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEGURIDAD ── */}
        <section id="seguridad" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="scroll-animate from-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium mb-4 border border-green-200">
                  🔒 Tus datos están seguros
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Tu información es tuya,<br />nadie más la ve
                </h2>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Entendemos que la información de tu negocio es lo más valioso que tenés.
                  Por eso GestPy fue diseñado desde el principio con la seguridad como prioridad.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '🔐', texto: 'Cada empresa tiene sus propios datos completamente aislados' },
                    { icon: '🛡️', texto: 'Contraseñas encriptadas — ni nosotros las podemos ver' },
                    { icon: '☁️', texto: 'Base de datos en servidores de alta disponibilidad en Sudamérica' },
                    { icon: '🚫', texto: 'No vendemos ni compartimos tu información con nadie' },
                    { icon: '👤', texto: 'Roles de usuario — controlás quién ve qué en tu empresa' },
                    { icon: '📋', texto: 'Acceso solo con usuario y contraseña seguros' },
                  ].map(s => (
                    <div key={s.texto} className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{s.icon}</span>
                      <p className="text-gray-600 text-sm">{s.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="scroll-animate from-right bg-gradient-to-br from-[#1E3A5F] to-[#2E6DA4] rounded-2xl p-8 text-white">
                <div className="text-5xl mb-4">🏦</div>
                <h3 className="text-xl font-bold mb-3">Infraestructura de nivel bancario</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  GestPy usa la misma tecnología de seguridad que usan los bancos y grandes empresas tecnológicas del mundo.
                </p>
                <div className="space-y-2">
                  {[
                    'Supabase PostgreSQL — base de datos empresarial',
                    'Vercel Edge Network — CDN global de alta velocidad',
                    'Next.js — framework usado por las empresas más grandes',
                    'Cifrado SSL/TLS en todas las comunicaciones',
                  ].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-white/60">
                      <span className="text-green-400">✓</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section id="precios" className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 scroll-animate">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Planes simples y transparentes</h2>
              <p className="text-gray-500">Sin costos ocultos. Cancelá cuando quieras.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

              {/* Básico */}
              <div className="scroll-animate delay-1 bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-md transition-all">
                <p className="text-sm font-medium text-gray-500 mb-2">Básico</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-bold text-gray-900">220.000</p>
                  <p className="text-gray-500 text-sm mb-1">Gs./mes</p>
                </div>
                <p className="text-xs text-gray-400 mb-6">Ideal para emprendedores</p>
                <div className="space-y-3 mb-8">
                  {[
                    '5 proveedores',
                    '10 clientes',
                    '20 artículos',
                    '30 facturas de compra/mes',
                    '30 facturas de venta/mes',
                    '1 usuario',
                    'Reportes básicos',
                    'Soporte por email',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/registro"
                  className="block w-full text-center py-3 rounded-xl border-2 border-[#1E3A5F] text-[#1E3A5F] font-semibold text-sm hover:bg-[#1E3A5F] hover:text-white transition-colors">
                  Empezar 15 días gratis
                </Link>
              </div>

              {/* Pro */}
              <div className="scroll-animate delay-2 scale-up bg-[#1E3A5F] rounded-2xl border border-[#1E3A5F] p-8 hover:shadow-xl transition-all relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full bg-[#7DD3FC] text-[#1E3A5F] text-xs font-bold">
                    MÁS POPULAR
                  </span>
                </div>
                <p className="text-sm font-medium text-white/60 mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-bold text-white">450.000</p>
                  <p className="text-white/60 text-sm mb-1">Gs./mes</p>
                </div>
                <p className="text-xs text-white/40 mb-6">Para empresas en crecimiento</p>
                <div className="space-y-3 mb-8">
                  {[
                    'Proveedores ilimitados',
                    'Clientes ilimitados',
                    'Artículos ilimitados',
                    'Facturas ilimitadas',
                    'Hasta 5 usuarios *',
                    'Reportes completos',
                    'Exportar a Excel',
                    'Timbrado SET',
                    'Soporte por WhatsApp',
                    'Acceso a nuevas funciones',
                    'Carga masiva de datos *',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="text-[#7DD3FC] font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/registro"
                  className="block w-full text-center py-3 rounded-xl bg-white text-[#1E3A5F] font-bold text-sm hover:bg-gray-100 transition-colors">
                  Empezar 15 días gratis
                </Link>
              </div>

              {/* Personalizado */}
              <div className="scroll-animate delay-3 bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-md transition-all">
                <p className="text-sm font-medium text-gray-500 mb-2">Personalizado</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-bold text-gray-900">A medida</p>
                </div>
                <p className="text-xs text-gray-400 mb-6">Para necesidades especiales</p>
                <div className="space-y-3 mb-8">
                  {[
                    'Todo lo del plan Pro',
                    'Usuarios ilimitados',
                    'Funciones personalizadas',
                    'Integraciones especiales',
                    'Capacitación incluida',
                    'Soporte dedicado',
                    'SLA garantizado',
                    'Facturación a medida',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
                <a href="https://wa.me/595981612950"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-green-500 text-green-600 font-semibold text-sm hover:bg-green-500 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contactar por WhatsApp
                </a>
              </div>

            </div>

            {/* ── NOTA CARGA MASIVA ── */}
            <div className="scroll-animate mt-8 rounded-2xl border border-dashed border-[#2E6DA4]/40 bg-blue-50/50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-2xl shrink-0">📥</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-0.5">
                  ¿Tenés muchos datos para cargar?{' '}
                  <span className="text-[#2E6DA4]">Servicio de carga masiva disponible</span>
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Importamos tus clientes, proveedores, artículos y saldos iniciales desde Excel o tu sistema anterior.
                  Servicio con cargo adicional — consultá disponibilidad y precio según volumen.
                </p>
              </div>
              <a
                href="https://wa.me/595981612950?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20carga%20masiva%20de%20datos%20en%20GestPy"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#2E6DA4] transition-colors whitespace-nowrap"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar precio
              </a>
            </div>

            {/* Leyenda asterisco */}
            <p className="mt-4 text-center text-xs text-gray-400">
              * Usuarios adicionales y carga masiva de datos disponibles como servicio con cargo adicional — consultá disponibilidad y precio.
            </p>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 scroll-animate">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Preguntas frecuentes</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: '¿Mis datos están seguros?',
                  a: 'Sí. Cada empresa tiene sus datos completamente aislados. Usamos encriptación SSL en todas las comunicaciones y bases de datos de nivel empresarial. Tu información nunca se comparte con terceros.',
                },
                {
                  q: '¿Puedo cancelar en cualquier momento?',
                  a: 'Sí, podés cancelar cuando quieras sin penalidades. No hay contratos de permanencia.',
                },
                {
                  q: '¿Funciona para cualquier tipo de negocio?',
                  a: 'GestPy está diseñado para cualquier empresa que compre y venda productos. Comercios, distribuidoras, importadoras, consultoras y más.',
                },
                {
                  q: '¿Puedo usar el sistema desde mi celular?',
                  a: 'Sí, GestPy funciona desde cualquier dispositivo con internet — celular, tablet o computadora. No necesitás instalar nada.',
                },
                {
                  q: '¿Qué pasa cuando termina el período de prueba?',
                  a: 'Te avisamos con anticipación para que puedas elegir tu plan. Si no contratás, el acceso se pausa pero tus datos se conservan por 30 días.',
                },
                {
                  q: '¿Puedo manejar varias empresas?',
                  a: 'Sí, con el plan Pro podés manejar múltiples empresas desde una sola cuenta, ideal para contadores o grupos empresariales.',
                },
                {
                  q: '¿Puedo agregar más usuarios o cargar datos masivamente?',
                  a: 'El plan Pro incluye hasta 5 usuarios. Si necesitás más usuarios o querés importar clientes, proveedores y artículos desde Excel o tu sistema anterior, ofrecemos esos servicios con un cargo adicional. Consultanos por WhatsApp para coordinar.',
                },
              ].map((f, i) => (
                <details key={f.q} className={`scroll-animate delay-${Math.min(i + 1, 6)} group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden`}>
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-gray-900 text-sm">
                    {f.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg">↓</span>
                  </summary>
                  <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section id="contacto" className="py-20 px-6 bg-gradient-to-br from-[#1E3A5F] to-[#2E6DA4]">
          <div className="max-w-3xl mx-auto text-center scroll-animate">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Listo para ordenar tu negocio?
            </h2>
            <p className="text-white/70 mb-8">
              Empezá hoy con 15 días gratis. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link href="/registro"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#1E3A5F] font-bold text-base hover:bg-gray-100 transition-colors shadow-lg">
                Crear cuenta gratis →
              </Link>
              <a href="https://wa.me/595981612950" target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-green-400">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Hablar con ventas
              </a>
            </div>
            <p className="text-white/40 text-xs">
              ¿Tenés dudas? Escribinos a{' '}
              <a href="mailto:contacto@linkea.com.py" className="text-white/60 hover:text-white underline">
                contacto@linkea.com.py
              </a>
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-gray-900 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Logo + copyright */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-bold text-white">GestPy</span>
              <span className="text-gray-500 text-sm ml-1">© 2026</span>
            </div>

            {/* Iconos de contacto */}
            <div className="flex items-center gap-5">

              {/* WhatsApp */}
              <a href="https://wa.me/595981612950" target="_blank" rel="noopener noreferrer"
                title="WhatsApp"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors group">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-gray-400 group-hover:text-white transition-colors">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>

              {/* Email */}
              <a href="mailto:contacto@linkea.com.py" title="Email"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-[#2E6DA4] flex items-center justify-center transition-colors group">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>

              {/* Login */}
              <Link href="/login" title="Ingresar al sistema"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-[#1E3A5F] flex items-center justify-center transition-colors group">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </Link>

            </div>

            {/* Créditos */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-gray-600 text-xs">Hecho con ❤️ en Paraguay 🇵🇾</p>
              <p className="text-gray-700 text-xs">
                Desarrollado por{' '}
                <a href="https://linkea.com.py" target="_blank" rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors font-medium">
                  Linkea EAS
                </a>
              </p>
            </div>

          </div>
        </footer>

      </div>
    </>
  )
}