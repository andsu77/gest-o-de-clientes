/**
 * Jest + ts-jest: o ts-jest compila os arquivos .ts antes de rodar os testes,
 * então escrevemos testes em TypeScript e ainda ganhamos checagem de tipos.
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
};
