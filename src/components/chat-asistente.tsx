/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
// src/components/chat-asistente.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send, Bot, Loader2, ChevronDown } from 'lucide-react'

type Mensaje = {
  id:      string
  role:    'user' | 'assistant'
  content: string
}

const MENSAJES_RAPIDOS = [
  '¿Cómo registro una venta?',
  '¿Cómo agrego un artículo?',
  '¿Cómo funciona el timbrado?',
  '¿Cómo concilio el banco?',
]

function MensajeTexto({ content }: { content: string }) {
  // Renderizar markdown básico: **negrita**, listas numeradas, listas con -
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />

        // Listas numeradas
        if (/^\d+\.\s/.test(line)) {
          const texto = line.replace(/^\d+\.\s/, '')
          const num   = line.match(/^(\d+)/)?.[1]
          return (
            <div key={i} className="flex gap-2">
              <span className="font-semibold shrink-0">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(texto) }} />
            </div>
          )
        }

        // Listas con -
        if (/^[-•]\s/.test(line)) {
          const texto = line.replace(/^[-•]\s/, '')
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(texto) }} />
            </div>
          )
        }

        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        )
      })}
    </div>
  )
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
}

export default function ChatAsistente() {
  const { data: session } = useSession()
  const user            = session?.user as any
  const colorPrimario   = user?.colorPrimario   || '#1E3A5F'
  const colorSecundario = user?.colorSecundario  || '#2E6DA4'
  const empresaNombre   = user?.empresaNombre    || 'Mi Empresa'

  const [abierto,   setAbierto]   = useState(false)
  const [mensajes,  setMensajes]  = useState<Mensaje[]>([])
  const [input,     setInput]     = useState('')
  const [cargando,  setCargando]  = useState(false)
  const [streaming, setStreaming] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([{
        id:      'bienvenida',
        role:    'assistant',
        content: `¡Hola! 👋 Soy el asistente de GestPy. Estoy aquí para ayudarte a sacarle el máximo provecho al sistema.\n\n¿En qué puedo ayudarte hoy?`,
      }])
    }
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [abierto])

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(texto?: string) {
    const contenido = (texto || input).trim()
    if (!contenido || cargando) return

    setInput('')
    setCargando(true)

    const nuevoMensajeUsuario: Mensaje = {
      id:      Date.now().toString(),
      role:    'user',
      content: contenido,
    }

    const historialConUsuario = [...mensajes, nuevoMensajeUsuario]
    setMensajes(historialConUsuario)

    // Placeholder del asistente mientras llega la respuesta
    const idRespuesta = (Date.now() + 1).toString()
    setMensajes(prev => [...prev, { id: idRespuesta, role: 'assistant', content: '' }])
    setStreaming(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortRef.current.signal,
        body:    JSON.stringify({
          messages: historialConUsuario.map(m => ({
            role:    m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) throw new Error('Error del servidor')

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let   texto   = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        texto += decoder.decode(value, { stream: true })

        // Actualizar el mensaje del asistente en tiempo real
        setMensajes(prev =>
          prev.map(m => m.id === idRespuesta ? { ...m, content: texto } : m)
        )
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMensajes(prev =>
          prev.map(m =>
            m.id === idRespuesta
              ? { ...m, content: 'Lo siento, hubo un error. Por favor intentá de nuevo.' }
              : m
          )
        )
      }
    } finally {
      setCargando(false)
      setStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  function limpiarChat() {
    setMensajes([])
    setTimeout(() => {
      setMensajes([{
        id:      'bienvenida-2',
        role:    'assistant',
        content: `¡Hola de nuevo! 👋 ¿En qué puedo ayudarte?`,
      }])
    }, 100)
  }

  return (
    <>
      {/* ── BURBUJA FLOTANTE ── */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl"
          style={{ backgroundColor: colorPrimario }}
          title="Asistente GestPy"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {/* Punto verde de "en línea" */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* ── VENTANA DE CHAT ── */}
      {abierto && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: colorPrimario }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Asistente GestPy</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  En línea
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={limpiarChat}
                title="Limpiar chat"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              >
                ↺
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {mensajes.map(m => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {m.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Burbuja */}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: colorPrimario } : {}}
                >
                  {m.role === 'assistant' && m.content === '' ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : m.role === 'assistant' ? (
                    <MensajeTexto content={m.content} />
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Preguntas rápidas (solo si hay pocos mensajes) */}
          {mensajes.length <= 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {MENSAJES_RAPIDOS.map(p => (
                  <button
                    key={p}
                    onClick={() => enviar(p)}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Escribí tu consulta..."
              disabled={cargando}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 bg-gray-50"
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || cargando}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shrink-0"
              style={{ backgroundColor: colorPrimario }}
            >
              {cargando
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-2 bg-white">
            <p className="text-center text-xs text-gray-300">Powered by Claude AI</p>
          </div>
        </div>
      )}
    </>
  )
}