/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/use-tour.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export type TourStep = {
  element: string        // selector CSS del elemento a señalar
  popover: {
    title:       string
    description: string
    side?:       'top' | 'right' | 'bottom' | 'left'
    align?:      'start' | 'center' | 'end'
  }
}

type UseTourOptions = {
  tourId:    string        // identificador único del tour (ej: 'dashboard', 'ventas')
  steps:     TourStep[]
  autoStart?: boolean      // si debe arrancar automáticamente si no lo vio
}

export function useTour({ tourId, steps, autoStart = true }: UseTourOptions) {
  const { data: session } = useSession()
  const driverRef = useRef<any>(null)
  const startedRef = useRef(false)

   
  const user = session?.user as any
  const colorPrimario = user?.colorPrimario || '#1E3A5F'

  const startTour = useCallback(async () => {
    // Importar driver.js dinámicamente (solo en cliente)
    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')

    driverRef.current = driver({
      showProgress:     true,
      progressText:     '{{current}} de {{total}}',
      nextBtnText:      'Siguiente →',
      prevBtnText:      '← Anterior',
      doneBtnText:      '¡Entendido!',
      allowClose:       true,
      overlayOpacity:   0.55,
      stagePadding:     8,
      stageRadius:      12,
      popoverClass:     'gestpy-tour-popover',
      steps: steps.map(s => ({
        element: s.element,
        popover: {
          title:       s.popover.title,
          description: s.popover.description,
          side:        s.popover.side  || 'bottom',
          align:       s.popover.align || 'start',
        },
      })),
      onDestroyed: async () => {
        // Marcar como completado en la DB cuando termina o cierra
        await fetch('/api/tour', { method: 'POST' })
      },
    })

    // Inyectar estilos con el color primario de la empresa
    const styleId = 'gestpy-tour-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .gestpy-tour-popover .driver-popover-title {
          color: ${colorPrimario} !important;
          font-size: 15px !important;
          font-weight: 700 !important;
        }
        .gestpy-tour-popover .driver-popover-description {
          font-size: 13px !important;
          color: #4b5563 !important;
          line-height: 1.5 !important;
        }
        .gestpy-tour-popover .driver-popover-footer button {
          background-color: ${colorPrimario} !important;
          border-color: ${colorPrimario} !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          padding: 6px 14px !important;
        }
        .gestpy-tour-popover .driver-popover-footer .driver-popover-prev-btn {
          background-color: transparent !important;
          color: #6b7280 !important;
          border-color: #e5e7eb !important;
        }
        .gestpy-tour-popover .driver-popover-footer .driver-popover-prev-btn:hover {
          background-color: #f9fafb !important;
        }
        .gestpy-tour-popover {
          border-radius: 16px !important;
          padding: 20px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important;
          max-width: 320px !important;
        }
        .driver-popover-progress-text {
          color: #9ca3af !important;
          font-size: 11px !important;
        }
      `
      document.head.appendChild(style)
    }

    driverRef.current.drive()
  }, [steps, colorPrimario])

  // Arranque automático: solo si el usuario no vio el tour aún
  useEffect(() => {
    if (!autoStart || !session || startedRef.current) return

    const check = async () => {
      const res  = await fetch('/api/tour')
      const data = await res.json()

      if (!data.tourCompletado) {
        startedRef.current = true
        // Pequeño delay para que la página termine de renderizar
        setTimeout(() => startTour(), 800)
      }
    }

    check()
  }, [session, autoStart, startTour])

  // Función para relanzar el tour manualmente (botón de ayuda)
  const relanzarTour = useCallback(async () => {
    await fetch('/api/tour', { method: 'DELETE' })
    startedRef.current = false
    setTimeout(() => startTour(), 300)
  }, [startTour])

  return { startTour, relanzarTour }
}