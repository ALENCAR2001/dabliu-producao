const KEY = 'dabliu-sistema-config-v1'

export type SistemaConfig = {
  /** Valor médio por peça (R$) para estimar receita no dashboard */
  valorMedioPeca?: number
}

export function loadSistemaConfig(): SistemaConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SistemaConfig
  } catch {
    return {}
  }
}

export function saveSistemaConfig(config: SistemaConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function setValorMedioPeca(valor: number | undefined): void {
  const cfg = loadSistemaConfig()
  if (valor === undefined || valor <= 0) {
    delete cfg.valorMedioPeca
  } else {
    cfg.valorMedioPeca = valor
  }
  saveSistemaConfig(cfg)
}
