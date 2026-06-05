import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function sanitizeEnvValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const v = raw.trim().replace(/^["']|["']$/g, '')
  return v.length > 0 ? v : undefined
}

const url = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const anonKey = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url.length > 0 && anonKey.length > 0)
}

/** Mensagem curta quando o selo aparece como Local. */
export function getCloudSetupHint(): string {
  if (isSupabaseConfigured()) return ''
  if (import.meta.env.DEV) {
    return 'Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env e reinicie npm run dev.'
  }
  return 'Na Vercel: Settings → Environment Variables (VITE_SUPABASE_*) → Redeploy.'
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export type ProductionClosureRow = {
  id: string
  created_at: string
  layout_id: string | null
  marca: string
  tipo_modelo: string
  tipo_modelo_label: string
  nome: string
  codigo: string
  cor_tecido: string
  quantidades: Record<string, number>
  total: number
  observacoes: string | null
}
