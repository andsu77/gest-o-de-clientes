/**
 * DINHEIRO EM CENTAVOS
 * --------------------
 * Em JavaScript: 0.1 + 0.2 === 0.30000000000000004  (!!)
 * Isso acontece porque números decimais são guardados em binário de forma
 * aproximada. Em sistema financeiro, esse erro vira centavos sumindo.
 *
 * Solução profissional e simples: guardar tudo em CENTAVOS inteiros.
 *   R$ 70,00  -> 7000
 *   R$ 49,90  -> 4990
 * Somar inteiros nunca erra. Só convertemos para "R$" na hora de exibir.
 */

/** 70.5 -> 7050 (Math.round corrige imprecisões como 19.99 * 100 = 1998.9999) */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** 7050 -> "R$ 70,50" */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Soma uma lista de valores em centavos. reduce "acumula" um resultado percorrendo o array. */
export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
