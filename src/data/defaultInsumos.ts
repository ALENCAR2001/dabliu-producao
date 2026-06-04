import type { InsumoItem } from '../types/insumos'
import { buildItemUnico } from '../utils/insumoSimples'
import { buildDefaultTintas } from '../utils/tintaVariants'

const now = () => new Date().toISOString()

export const DEFAULT_INSUMOS: InsumoItem[] = [
  { id: 'cola-1', categoria: 'cola', nome: 'Cola padrão', quantidade: 3, updatedAt: now() },
  { ...buildItemUnico('fita', 8), updatedAt: now() },
  { ...buildItemUnico('emulsao', 5), updatedAt: now() },
  { ...buildItemUnico('desgravador', 2), updatedAt: now() },
  { ...buildItemUnico('solvente', 4), updatedAt: now() },
  ...buildDefaultTintas(),
]
