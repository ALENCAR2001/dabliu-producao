/** Mesma regra do app — PIN 1007 vira 001007 no Supabase Auth. */
export function pinToSupabasePassword(pin) {
  const digits = String(pin).replace(/\D/g, '')
  if (digits.length >= 6) return digits
  return digits.padStart(6, '0')
}
