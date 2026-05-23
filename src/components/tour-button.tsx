// src/components/tour-button.tsx
// Botón flotante "?" que relanza el tour en cualquier página
// Uso: <TourButton onRelanzar={relanzarTour} />
'use client'

import { HelpCircle } from 'lucide-react'

type Props = {
  onRelanzar: () => void
  tooltip?: string
}

export default function TourButton({ onRelanzar, tooltip = 'Ver tour de ayuda' }: Props) {
  return (
    <button
      onClick={onRelanzar}
      title={tooltip}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-xl transition-all hover:scale-110"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  )
}