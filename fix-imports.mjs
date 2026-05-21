import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function walk(dir) {
  let files = []
  readdirSync(dir).forEach(f => {
    const full = join(dir, f)
    if (statSync(full).isDirectory()) files = files.concat(walk(full))
    else if (f === 'route.ts') files.push(full)
  })
  return files
}

const routes = walk('src/app/api')
let count = 0

for (const file of routes) {
  let content = readFileSync(file, 'utf-8')
  
  if (content.includes('getEmpresaId') && !content.includes('import { getEmpresaId }')) {
    content = content.replace(
      "import { prisma } from '@/lib/prisma'",
      "import { prisma } from '@/lib/prisma'\nimport { getEmpresaId } from '@/lib/get-empresa-id'"
    )
    writeFileSync(file, content, 'utf-8')
    console.log('Fixed: ' + file)
    count++
  }
}
console.log(count + ' archivos corregidos')