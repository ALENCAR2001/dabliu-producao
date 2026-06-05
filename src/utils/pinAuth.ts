/** Supabase Auth exige senha com pelo menos 6 caracteres; PIN da equipe tem 4 dígitos. */
export function pinToSupabasePassword(pin: string): string {
  const digits = pin.replace(/\D/g, '')
  if (digits.length >= 6) return digits
  return digits.padStart(6, '0')
}
