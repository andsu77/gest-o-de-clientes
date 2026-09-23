/**
 * Testes de VALIDAÇÃO (Zod).
 *
 * Aqui não existe banco, service nem HTTP: testamos só os schemas.
 * safeParse() é a versão "que não lança erro" do parse():
 *   - result.success === true  -> result.data tem os dados limpos
 *   - result.success === false -> result.error.issues lista o que está errado
 *
 * Esses são exatamente os exemplos do enunciado:
 *   nome: ""      -> recusado
 *   email: "abc"  -> recusado
 *   valor: -100   -> recusado
 */
import { createClientSchema } from '../../src/validators/client.validator';
import { parseId } from '../../src/validators/common';
import { createPaymentSchema, generateChargesSchema } from '../../src/validators/payment.validator';
import { ValidationError } from '../../src/errors/AppError';

/** Devolve os caminhos dos campos com erro, ex.: ['name', 'email']. */
function invalidFields(result: { success: boolean; error?: { issues: { path: (string | number)[] }[] } }): string[] {
  return result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.path.join('.'));
}

describe('Validação de cliente', () => {
  it('recusa nome vazio', () => {
    const result = createClientSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    expect(invalidFields(result)).toContain('name');
  });

  it('recusa e-mail inválido', () => {
    const result = createClientSchema.safeParse({ name: 'João', email: 'abc' });
    expect(result.success).toBe(false);
    expect(invalidFields(result)).toContain('email');
  });

  it('aceita cliente válido, limpa espaços e transforma "" em null', () => {
    const result = createClientSchema.safeParse({
      name: '  Padaria do João  ',
      email: 'JOAO@PADARIA.COM',
      company: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Padaria do João');
      expect(result.data.email).toBe('joao@padaria.com');
      expect(result.data.company).toBeNull();
    }
  });

  it('recusa status que não existe', () => {
    const result = createClientSchema.safeParse({ name: 'João', status: 'SUMIDO' });
    expect(invalidFields(result)).toContain('status');
  });
});

describe('Validação de pagamento', () => {
  const valid = { clientId: 1, amountCents: 7000, dueDate: '2026-10-10' };

  it('recusa valor negativo', () => {
    const result = createPaymentSchema.safeParse({ ...valid, amountCents: -100 });
    expect(invalidFields(result)).toContain('amountCents');
  });

  it('recusa valor zero e valor quebrado (centavos devem ser inteiros)', () => {
    expect(invalidFields(createPaymentSchema.safeParse({ ...valid, amountCents: 0 }))).toContain('amountCents');
    expect(invalidFields(createPaymentSchema.safeParse({ ...valid, amountCents: 70.5 }))).toContain('amountCents');
  });

  it('recusa data inválida', () => {
    const result = createPaymentSchema.safeParse({ ...valid, dueDate: 'ontem' });
    expect(invalidFields(result)).toContain('dueDate');
  });

  it('aceita pagamento válido e converte a data para Date', () => {
    const result = createPaymentSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBeInstanceOf(Date);
  });

  it('valida o formato do mês de geração de cobranças', () => {
    expect(generateChargesSchema.safeParse({ month: '2026-10' }).success).toBe(true);
    expect(generateChargesSchema.safeParse({ month: '2026-13' }).success).toBe(false);
  });
});

describe('parseId', () => {
  it('converte "12" em 12 e recusa textos', () => {
    expect(parseId('12')).toBe(12);
    expect(() => parseId('abc')).toThrow(ValidationError);
  });
});
