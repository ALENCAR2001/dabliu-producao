import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url.length > 0 && anonKey.length > 0)
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
