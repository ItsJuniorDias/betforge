import { createApp } from "./app.js";
import { testConnection } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

process.on("uncaughtException", (err) => {
  console.error("ERRO REAL:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("PROMISE REJEITADA:", reason);
  process.exit(1);
});

async function bootstrap() {
  try {
    logger.info("🚀 Iniciando BetForge API...");

    // Verificar conexões externas
    await testConnection();
    await connectRedis();

    // Criar app e subir servidor
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`✅ Servidor rodando em http://localhost:${env.PORT}`);
      logger.info(
        `📡 API disponível em http://localhost:${env.PORT}/api/${env.API_VERSION}`,
      );
      logger.info(`🌎 Ambiente: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`⚡ Recebido ${signal}. Encerrando graciosamente...`);
      server.close(async () => {
        logger.info("✅ Servidor HTTP encerrado");
        process.exit(0);
      });

      // Forçar encerramento após 10s
      setTimeout(() => {
        logger.error("❌ Encerramento forçado por timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Erros não capturados
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
      process.exit(1);
    });
  } catch (err) {
    logger.error("❌ Falha ao iniciar o servidor:", err);
    process.exit(1);
  }
}

bootstrap();
