/**
 * Assistente no terminal — colar 3 chaves do Supabase (sem editar .env na mão)
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

const rl = createInterface({ input, output })

function limpa(s) {
  return s.trim().replace(/^["']|["']$/g, '')
}

console.log('')
console.log('========================================')
console.log('  DABLIU — Configurar login na nuvem')
console.log('========================================')
console.log('')
console.log('Voce esta na pagina API do Supabase? (letra E)')
console.log('Vamos colar 3 coisas, uma por vez.')
console.log('')

await rl.question('Aperte ENTER para comecar...')

const url = limpa(await rl.question('\n1) Cole a Project URL e ENTER: '))
const anon = limpa(await rl.question('\n2) Cole a chave anon public e ENTER: '))
const service = limpa(await rl.question('\n3) Cole a service_role (Reveal no site) e ENTER: '))

if (!url || !anon || !service) {
  console.error('\n❌ Algum campo ficou vazio. Rode de novo.')
  rl.close()
  process.exit(1)
}

const finalUrl = url.startsWith('http') ? url : `https://${url}`

const envContent = `# Gerado pelo assistente DABLIU
VITE_SUPABASE_URL=${finalUrl}
VITE_SUPABASE_ANON_KEY=${anon}
VITE_AUTH_EMAIL_DOMAIN=dabliu.app
SUPABASE_SERVICE_ROLE_KEY=${service}
`

writeFileSync(envPath, envContent, 'utf8')
console.log('\n✓ Arquivo .env salvo em:', envPath)

const sqlPath = resolve(root, 'supabase', 'setup_completo.sql')
if (existsSync(sqlPath)) {
  console.log('\n--- PROXIMO: SQL no site Supabase ---')
  console.log('1) Menu SQL Editor → New query')
  console.log('2) Abra no Cursor o arquivo: supabase/setup_completo.sql')
  console.log('3) Ctrl+A, Ctrl+C, cole no site, clique RUN')
  console.log('')
  const fez = await rl.question('Ja rodou o SQL no site? (s/n): ')
  if (!/^s/i.test(fez)) {
    console.log('\nFaca o SQL primeiro, depois rode: npm run seed:auth')
    rl.close()
    process.exit(0)
  }
}

console.log('\nCriando usuarios (Michael 1001, admin admin123)...')
const seed = spawnSync(process.execPath, [resolve(root, 'scripts/seed-supabase-auth.mjs')], {
  cwd: root,
  stdio: 'inherit',
})

if (seed.status !== 0) {
  console.log('\n⚠️ Seed falhou. Confira se rodou setup_completo.sql no SQL Editor.')
  rl.close()
  process.exit(1)
}

console.log('\n--- ULTIMO PASSO NO SITE ---')
console.log('Authentication → Providers → Email → DESLIGUE Confirm email → Save')
console.log('\nDepois: npm run dev')
console.log('  Funcionario: Michael PIN 1001 | Admin: admin / admin123\n')

rl.close()
