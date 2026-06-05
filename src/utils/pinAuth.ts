/** Supabase Auth exige senha com pelo menos 6 caracteres; PIN da equipe tem 4 dígitos. */
export function pinToSupabasePassword(pin: string): string {
  const digits = pin.replace(/\D/g, '')
  if (digits.length >= 6) return digits
  return digits.padStart(6, '0')
}

/** Tentativas de senha Auth para o PIN digitado (cobre seed antigo e formatos alternativos). */
export function pinLoginPasswordCandidates(pin: string): string[] {
  const digits = pin.trim().replace(/\D/g, '')
  if (!digits) return []

  const candidates = [
    pinToSupabasePassword(digits),
    `${digits}00`,
    `00${digits}`,
    digits.length >= 6 ? digits : null,
  ].filter((v): v is string => Boolean(v))

  return [...new Set(candidates)]
}
