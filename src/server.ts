/**
 * PONTO DE ENTRADA
 * ----------------
 * 1. Carrega e valida o .env (import do env)
 * 2. Conecta no banco
 * 3. Monta o container e o app
 * 4. Começa a escutar na porta
 *
 * "main" é async porque conectar no banco é uma operação assíncrona.
 */
import { env } from './config/env';
import { buildContainer } from './container';
import { createApp } from './app';
import { prisma } from './database/prisma';

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao MySQL.');
  } catch (error) {
    console.error('❌ Não foi possível conectar ao MySQL. Verifique se ele está rodando e o DATABASE_URL no .env.');
    console.error(error);
    process.exit(1);
  }

  const app = createApp(buildContainer(prisma));

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`   Painel:  http://localhost:${env.PORT}`);
    console.log(`   Health:  http://localhost:${env.PORT}/api/health`);
  });

  // Encerramento gracioso: ao apertar Ctrl+C, fecha o servidor e a conexão do banco.
  const shutdown = async (): Promise<void> => {
    console.log('\nEncerrando...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// main() devolve uma Promise. O .catch garante que nenhum erro fique "solto".
main().catch((error) => {
  console.error('Falha ao iniciar:', error);
  process.exit(1);
});
