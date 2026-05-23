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
    sm: 'w-15 h-15',
    md: 'w-20 h-20',
    lg: 'w-25 h-25',
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