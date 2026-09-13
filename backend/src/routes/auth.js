import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';

export async function authRoutes(fastify, options) {
  // Registro de Novo Usuário
  fastify.post('/api/auth/register', async (request, reply) => {
    const { name, email, password } = request.body || {};

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return reply.code(400).send({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    try {
      // Verifica se o e-mail já existe
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
      if (existing.rows.length > 0) {
        return reply.code(409).send({ error: 'Este e-mail já está cadastrado.' });
      }

      // Hash seguro da senha
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Inserção do usuário
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name.trim(), trimmedEmail, passwordHash]
      );

      const newUser = result.rows[0];

      // Cria configurações padrão para o usuário
      await pool.query(
        `INSERT INTO settings (user_id, energy_kwh_rate, labor_hourly_rate)
         VALUES ($1, 0.85, 25.00)
         ON CONFLICT (user_id) DO NOTHING`,
        [newUser.id]
      );

      // Gera token JWT
      const token = fastify.jwt.sign({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      });

      return reply.code(201).send({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Erro ao registrar usuário. Tente novamente mais tarde.' });
    }
  });

  // Login de Usuário
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Informe e-mail e senha.' });
    }

    const trimmedEmail = email.toLowerCase().trim();

    try {
      const result = await pool.query(
        'SELECT id, name, email, password_hash FROM users WHERE email = $1',
        [trimmedEmail]
      );

      if (result.rows.length === 0) {
        return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Erro ao realizar login.' });
    }
  });

  // Perfil do Usuário Autenticado
  fastify.get('/api/auth/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.code(401).send({ error: 'Sessão expirada ou não autorizada.' });
      }
    }
  }, async (request, reply) => {
    try {
      const result = await pool.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [request.user.userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Usuário não encontrado.' });
      }

      return reply.send({ user: result.rows[0] });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Erro ao obter dados do usuário.' });
    }
  });
}
