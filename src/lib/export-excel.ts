/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx'

export function exportarExcel(datos: any[], nombreArchivo: string, nombreHoja: string = 'Datos') {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(datos)

  // Ancho de columnas automático
  const cols = Object.keys(datos[0] || {}).map(key => ({
    wch: Math.max(key.length, ...datos.map(d => String(d[key] || '').length)) + 2
  }))
  ws['!cols'] = cols

  XLSX.utils.book_append_sheet(wb, ws, nombreHoja)
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}