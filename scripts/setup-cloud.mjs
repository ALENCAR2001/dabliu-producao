/**
 * Configura login na nuvem (SQL + seed de usuários).
 * Requer .env com chaves do Supabase — veja docs/SETUP-RAPIDO.md
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) {
    console.error('❌ Arquivo .env não encontrado.')
    console.error('   Copie .env.example → .env e preencha as chaves do Supabase.')
    process.exit(1)
  }
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

function isPlaceholder(v) {
  if (!v) return true
  return /SEU_PROJETO|sua_chave|xxxx/i.test(v)
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const dbUrl = env.SUPABASE_DB_URL

let failed = false

console.log('\n🚀 DABLIU — configuração login na nuvem\n')

// —— 1. SQL via Postgres (opcional) ——
if (!isPlaceholder(dbUrl) && dbUrl.startsWith('postgres')) {
  console.log('📦 Aplicando SQL no banco (setup_completo.sql)…')
  try {
    const { default: pg } = await import('pg')
    const sql = readFileSync(resolve(root, 'supabase/setup_completo.sql'), 'utf8')
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    await client.connect()
    await client.query(sql)
    await client.end()
    console.log('   ✓ Tabelas e autenticação criadas no banco.\n')
  } catch (e) {
    console.error('   ✗ Erro ao rodar SQL:', e.message ?? e)
    console.error('   → Rode supabase/setup_completo.sql manualmente no SQL Editor.\n')
    failed = true
  }
} else {
  console.log('⏭ SQL automático: defina SUPABASE_DB_URL no .env')
  console.log('   (ou cole supabase/setup_completo.sql no SQL Editor do Supabase)\n')
}

// —— 2. Seed usuários ——
if (isPlaceholder(url) || isPlaceholder(serviceKey) || isPlaceholder(anonKey)) {
  console.error('❌ Preencha no .env:')
  if (isPlaceholder(url)) console.error('   - VITE_SUPABASE_URL')
  if (isPlaceholder(anonKey)) console.error('   - VITE_SUPABASE_ANON_KEY')
  if (isPlaceholder(serviceKey)) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n   Dashboard → Project Settings → API\n')
  failed = true
} else {
  console.log('👥 Criando usuários (admin + funcionários)…')
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(process.execPath, [resolve(root, 'scripts/seed-supabase-auth.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (r.status !== 0) {
    failed = true
  } else {
    console.log('')
  }
}

// —— 3. Teste rápido ——
if (!failed && !isPlaceholder(url) && !isPlaceholder(anonKey)) {
  console.log('🔐 Testando login admin na nuvem…')
  const { createClient } = await import('@supabase/supabase-js')
  const domain = env.VITE_AUTH_EMAIL_DOMAIN || 'dabliu.app'
  const sb = createClient(url, anonKey)
  const { error } = await sb.auth.signInWithPassword({
    email: `admin@${domain}`,
    password: 'admin123',
  })
  if (error) {
    console.error('   ✗ Login teste falhou:', error.message)
    console.error('   → Desative "Confirm email" em Authentication → Providers → Email')
    failed = true
  } else {
    await sb.auth.signOut()
    console.log('   ✓ Login admin OK (admin@' + domain + ' / admin123)\n')
  }
}

console.log('—'.repeat(50))
if (failed) {
  console.log('\n⚠️  Alguns passos falharam. Veja docs/SETUP-RAPIDO.md\n')
  process.exit(1)
}

console.log('\n✅ Login na nuvem pronto!')
console.log('   Reinicie: npm run dev')
console.log('   Administração deve mostrar selo "Nuvem"')
console.log('\n   Opcional: publique a função para alterar PINs:')
console.log('   supabase login && supabase functions deploy admin-update-password\n')
