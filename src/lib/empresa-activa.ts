export function getEmpresaActiva(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('superadmin_empresa_id')
}

export function setEmpresaActiva(id: string) {
  localStorage.setItem('superadmin_empresa_id', id)
}

export function clearEmpresaActiva() {
  localStorage.removeItem('superadmin_empresa_id')
}