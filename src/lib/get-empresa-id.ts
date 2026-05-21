/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers'

export async function getEmpresaId(session: any): Promise<string> {
  const user = session?.user as any

  // Si es SUPERADMIN y tiene empresa seleccionada en cookie
  if (user?.rol === 'SUPERADMIN') {
    const cookieStore = await cookies()
    const empresaOverride = cookieStore.get('superadmin_empresa_id')
    if (empresaOverride?.value) return empresaOverride.value
  }

  return user?.empresaId
}