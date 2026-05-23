/* eslint-disable @next/next/no-img-element */
// src/components/loading.tsx
// Uso: import Loading from '@/components/loading'
//      if (loading) return <Loading />
//      if (loading) return <Loading texto="Cargando ventas..." />
//      if (loading) return <Loading size="sm" />  ← más chico

type Props = {
  texto?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ texto, size = 'md' }: Props) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <img
        src="/loading.gif"
        alt="Cargando..."
        className={`${sizes[size]} object-contain`}
      />
      {texto && (
        <p className="text-gray-400 text-sm">{texto}</p>
      )}
    </div>
  )
}