import { toLocalYMD } from './calendar'

/** Funcionário só pode registrar ou alterar ponto do dia atual (horário local). */
export function isPontoDiaEditavelFuncionario(date: string, hoje: string = toLocalYMD(new Date())): boolean {
  return date === hoje
}

export function mensagemDiaNaoEditavel(date: string, hoje: string = toLocalYMD(new Date())): string {
  if (date > hoje) {
    return 'Não é possível registrar ponto em data futura.'
  }
  return 'Só é permitido registrar o ponto no dia de hoje. Para dias anteriores, use o botão "Preciso de ajuda".'
}
