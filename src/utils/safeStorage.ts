/** Evita crash silencioso quando o navegador enche o armazenamento local */
export function safeSetItem(key: string, value: string): { ok: true } | { ok: false; message: string } {
  try {
    localStorage.setItem(key, value)
    return { ok: true }
  } catch (e) {
    const isQuota =
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
    return {
      ok: false,
      message: isQuota
        ? 'Memória do navegador cheia. Apague PDFs antigos ou use outro aparelho.'
        : 'Não foi possível salvar no navegador.',
    }
  }
}
