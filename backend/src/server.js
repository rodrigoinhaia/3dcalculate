import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDb } from './db/pool.js';
import { authRoutes } from './routes/auth.js';
import { syncRoutes } from './routes/sync.js';

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production' ? { level: 'info' } : false,
});

// Registrar CORS
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Registrar JWT (chave secreta configurável)
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-3dcalc-makerpro-2026-production',
});

// Health check simples
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Registrar Rotas da Aplicação
await fastify.register(authRoutes);
await fastify.register(syncRoutes);

// Inicialização do Servidor
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    // Inicializa tabelas no PostgreSQL se necessário
    await initDb();

    await fastify.listen({ port, host });
    console.log(`[Fastify] Servidor ultra-leve rodando em http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
