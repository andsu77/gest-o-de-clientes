/**
 * VALIDAÇÃO COM ZOD — peças reutilizáveis
 * ----------------------------------------
 * O TypeScript só existe em tempo de COMPILAÇÃO. Quando uma requisição chega,
 * o corpo (req.body) é um JSON qualquer: pode ter nome vazio, e-mail "abc",
 * valor -100... O TypeScript não tem como impedir isso.
 *
 * O Zod valida em tempo de EXECUÇÃO. Um "schema" descreve o formato esperado:
 *   schema.parse(dados)  -> devolve os dados tipados e limpos, OU
 *                        -> lança ZodError (o errorHandler transforma em 400).
 * Bônus: z.infer<typeof schema> gera o tipo TypeScript a partir do schema.
 */
import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Mensagens em português para os erros mais comuns.
 * z.setErrorMap troca o "dicionário" de mensagens padrão do Zod.
 */
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'Campo obrigatório.' };
      if (issue.received === 'nan') return { message: 'Deve ser um número.' };
      return { message: `Tipo inválido: esperado ${issue.expected}.` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') return { message: `Deve ter pelo menos ${issue.minimum} caractere(s).` };
      if (issue.type === 'number') return { message: `Deve ser no mínimo ${issue.minimum}.` };
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `Deve ter no máximo ${issue.maximum} caracteres.` };
      if (issue.type === 'number') return { message: `Deve ser no máximo ${issue.maximum}.` };
      break;
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Use um destes: ${issue.options.join(', ')}.` };
    case z.ZodIssueCode.invalid_date:
      return { message: 'Data inválida. Use o formato AAAA-MM-DD.' };
    default:
      break;
  }
  return { message: ctx.defaultError };
});

/** Formulários HTML enviam "" para campos vazios. Tratamos "" como "não informado". */
const blankToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value);
const blankToUndefined = (value: unknown) =>
  value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value;

/** Texto opcional: "" vira null (apaga o campo). */
export const optionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());

/** Texto obrigatório com tamanho mínimo e máximo. */
export const requiredText = (min: number, max: number) => z.string().trim().min(min).max(max);

/** ID numérico positivo (aceita "12" e converte para 12 — útil em query string). */
export const idSchema = z.coerce.number().int().positive();
export const optionalId = z.preprocess(blankToUndefined, idSchema.optional());
export const nullableId = z.preprocess(blankToNull, idSchema.nullable().optional());

/** Dinheiro em centavos: inteiro. 7000 = R$ 70,00 */
export const positiveCents = z.coerce.number().int('Informe o valor em centavos (número inteiro).').positive('O valor deve ser maior que zero.');
export const nonNegativeCents = z.coerce.number().int('Informe o valor em centavos (número inteiro).').min(0, 'O valor não pode ser negativo.');

/** Datas "AAAA-MM-DD". z.coerce.date() faz new Date(valor) e rejeita datas inválidas. */
// null/"" viram undefined => "Data inválida" (sem isso, new Date(null) viraria 01/01/1970!)
export const requiredDate = z.preprocess(blankToUndefined, z.coerce.date());
export const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional());
export const nullableDate = z.preprocess(blankToNull, z.coerce.date().nullable().optional());

/** Aplica "" -> undefined antes do schema (filtros de query string). */
export const optionalQuery = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

/** Converte e valida o :id da URL. Lança ValidationError (400) se não for número válido. */
export function parseId(value: unknown): number {
  const result = idSchema.safeParse(value);
  if (!result.success) throw new ValidationError('ID inválido na URL.');
  return result.data;
}
