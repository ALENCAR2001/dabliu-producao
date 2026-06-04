import type { InsumoItem } from '../types/insumos'
import { syncTintaCatalogWithItems } from './tintaCoresCatalog'
import { ensureItensUnicos } from './insumoSimples'
import { ensureTintaVariants } from './tintaVariants'

export function ensureInsumoCatalog(items: InsumoItem[]): InsumoItem[] {
  syncTintaCatalogWithItems(items)
  return ensureItensUnicos(ensureTintaVariants(items))
}
