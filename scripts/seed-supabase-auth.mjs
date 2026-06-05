/**
 * Cria usuários Auth + perfis no Supabase (rode uma vez).
 *
 * Uso:
 *   1. Copie .env.example → .env e preencha VITE_SUPABASE_* 
 *   2. Adicione SUPABASE_SERVICE_ROLE_KEY (Dashboard → API → service_role)
 *   3. Execute auth_schema.sql no SQL Editor
 *   4. node scripts/seed-supabase-auth.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pinToSupabasePassword } from './pin-auth.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) {
    console.error('Arquivo .env não encontrado. Copie .env.example')
    process.exit(1)
  }
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const domain = env.VITE_AUTH_EMAIL_DOMAIN || 'dabliu.app'

if (!url || !serviceKey) {
  console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEAM = [
  { legacy_id: 'admin-1', nome: 'Administrador', login: 'admin', password: 'admin123', role: 'admin' },
  { legacy_id: 'func-1', nome: 'Michael Jackson', login: 'michael', password: '1001', role: 'funcionario' },
  { legacy_id: 'func-2', nome: 'Hamilton Santos', login: 'hamilton', password: '1002', role: 'funcionario' },
  { legacy_id: 'func-3', nome: 'Iuri', login: 'iuri', password: '1003', role: 'funcionario' },
  { legacy_id: 'func-4', nome: 'Gabriel Alencar', login: 'gabriel', password: '1004', role: 'funcionario' },
  { legacy_id: 'func-5', nome: 'Christian Nascimento', login: 'christian', password: '1005', role: 'funcionario' },
  { legacy_id: 'func-6', nome: 'Bruno Brasil', login: 'bruno', password: '1006', role: 'funcionario' },
  { legacy_id: 'func-7', nome: 'Kaique Gomes', login: 'kaique', password: '1007', role: 'funcionario' },
  { legacy_id: 'func-8', nome: 'David Oliveira', login: 'david', password: '1008', role: 'funcionario' },
]

function authEmail(login, role) {
  const slug = login.trim().toLowerCase()
  if (role === 'admin') return `admin@${domain}`
  return `${slug}@${domain}`
}

function authPassword(member) {
  if (member.role === 'funcionario') return pinToSupabasePassword(member.password)
  return member.password
}

async function upsertUser(member) {
  const email = authEmail(member.login, member.role)
  const password = authPassword(member)

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: {
        legacy_id: member.legacy_id,
        nome: member.nome,
        login: member.login,
        role: member.role,
      },
    })
    if (error) throw error

    await admin.from('profiles').upsert({
      id: existing.id,
      legacy_id: member.legacy_id,
      nome: member.nome,
      login: member.login,
      role: member.role,
      active: true,
    })

    console.log(`✓ Atualizado: ${member.nome} (${email})`)
    return
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      legacy_id: member.legacy_id,
      nome: member.nome,
      login: member.login,
      role: member.role,
    },
  })
  if (error) throw error

  await admin.from('profiles').upsert({
    id: data.user.id,
    legacy_id: member.legacy_id,
    nome: member.nome,
    login: member.login,
    role: member.role,
    active: true,
  })

  console.log(`✓ Criado: ${member.nome} (${email})`)
}

console.log(`DABLIU — seed Auth (@${domain})\n`)

for (const member of TEAM) {
  try {
    await upsertUser(member)
  } catch (e) {
    console.error(`✗ ${member.nome}:`, e.message ?? e)
  }
}

console.log('\nPronto. Desative "Confirm email" em Auth → Providers → Email se ainda estiver ativo.')
console.log('Deploy da função: supabase functions deploy admin-update-password')
