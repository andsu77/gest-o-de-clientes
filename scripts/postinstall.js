/**
 * Roda automaticamente depois de "npm install".
 *  1. prisma generate  -> gera o Prisma Client tipado
 *  2. tsc              -> compila src/ para dist/ (o "npm start" roda dist/server.js)
 *  3. só no Render: prisma migrate deploy -> cria/atualiza as tabelas do banco online
 *
 * Assim o deploy funciona mesmo que o Build Command do Render seja só "npm install".
 */
const { execSync } = require('node:child_process');

const run = (command) => execSync(command, { stdio: 'inherit' });

run('npx prisma generate');
run('npx tsc -p tsconfig.build.json');

// O Render define RENDER=true no ambiente. Localmente, use "npm run db:migrate".
if (process.env.RENDER && process.env.DATABASE_URL) {
  run('npx prisma migrate deploy');
}
