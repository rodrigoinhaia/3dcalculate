import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';

const PAYMENT_METHODS = ['dinheiro', 'pix', 'debito', 'credito'];

function shelfPrice(retail, mode, markupPercent, markupAmount = 0) {
  const base = Number(retail) || 0;
  if (mode === 'amount') {
    return Math.round((base + (Number(markupAmount) || 0)) * 100) / 100;
  }
  if (mode === 'markup') {
    const markup = Number(markupPercent) || 0;
    return Math.round(base * (1 + markup / 100) * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}

async function requirePartner(request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Faça login na loja para continuar.' });
  }
  if (request.user?.role !== 'partner' || !request.user.partnerId || !request.user.userId) {
    return reply.code(403).send({ error: 'Acesso exclusivo da loja parceira.' });
  }
}

async function requireMaker(request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Entre na sua conta para salvar o acesso da loja.' });
  }
  if (request.user?.role === 'partner' || !request.user?.userId) {
    return reply.code(403).send({ error: 'Acesso exclusivo do vendedor.' });
  }
}

export async function partnerRoutes(fastify) {
  fastify.post('/api/partners/access', { preHandler: requireMaker }, async (request, reply) => {
    const { partnerId, name, loginEmail, loginPassword } = request.body || {};
    const email = String(loginEmail || '').toLowerCase().trim();
    const password = String(loginPassword || '');
    if (!partnerId || !email || password.length < 6) {
      return reply.code(400).send({ error: 'Informe a loja, o e-mail e uma senha com no mínimo 6 caracteres.' });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO partners (id, user_id, name, login_email, password_hash, updated_at, is_deleted)
         VALUES ($1, $2, $3, $4, $5, NOW(), FALSE)
         ON CONFLICT (id, user_id) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, partners.name),
           login_email = EXCLUDED.login_email,
           password_hash = EXCLUDED.password_hash,
           updated_at = NOW(),
           is_deleted = FALSE`,
        [String(partnerId).slice(0, 100), request.user.userId, String(name || 'Loja').slice(0, 255), email, hash]
      );
      return reply.send({ ok: true, loginEmail: email });
    } catch (err) {
      if (err.code === '23505') {
        return reply.code(409).send({ error: 'Este e-mail já está em uso por outra loja.' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Não foi possível gravar o acesso da loja.' });
    }
  });

  fastify.post('/api/partner/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Informe e-mail e senha.' });
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    try {
      const result = await pool.query(
        `SELECT id, user_id, name, password_hash
         FROM partners
         WHERE lower(login_email) = $1 AND is_deleted = FALSE
         LIMIT 1`,
        [trimmedEmail]
      );
      const partner = result.rows[0];
      if (!partner?.password_hash) {
        return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
      }
      const match = await bcrypt.compare(password, partner.password_hash);
      if (!match) {
        return reply.code(401).send({ error: 'E-mail ou senha incorretos.' });
      }

      const token = fastify.jwt.sign({
        role: 'partner',
        partnerId: partner.id,
        userId: partner.user_id,
        name: partner.name,
      });

      return reply.send({
        token,
        partner: { id: partner.id, name: partner.name },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Erro ao entrar na loja.' });
    }
  });

  fastify.get('/api/partner/catalog', { preHandler: requirePartner }, async (request, reply) => {
    const { userId, partnerId, name } = request.user;
    try {
      const result = await pool.query(
        `SELECT
           d.id AS "dispatchId",
           d.product_id AS "productId",
           p.title,
           p.image_url AS "imageUrl",
           p.category,
           d.unit_retail_price AS "sellerPrice",
           d.commission_percent AS "commissionPercent",
           COALESCE(d.commission_mode, 'included') AS "commissionMode",
           GREATEST(d.quantity_sent - d.quantity_sold, 0) AS available,
           COALESCE(pp.price_mode, 'seller') AS "priceMode",
           COALESCE(pp.markup_percent, 0) AS "markupPercent",
           COALESCE(pp.markup_amount, 0) AS "markupAmount"
         FROM dispatches d
         JOIN products p
           ON p.id = d.product_id AND p.user_id = d.user_id AND p.is_deleted = FALSE
         LEFT JOIN partner_prices pp
           ON pp.user_id = d.user_id AND pp.partner_id = d.partner_id AND pp.product_id = d.product_id
         WHERE d.user_id = $1 AND d.partner_id = $2 AND d.is_deleted = FALSE
           AND d.quantity_sent > d.quantity_sold
         ORDER BY p.title, d.date_sent`,
        [userId, partnerId]
      );

      const items = result.rows.map((row) => ({
        ...row,
        available: Number(row.available) || 0,
        sellerPrice: Number(row.sellerPrice) || 0,
        commissionPercent: Number(row.commissionPercent) || 0,
        markupPercent: Number(row.markupPercent) || 0,
        markupAmount: Number(row.markupAmount) || 0,
        shelfPrice: shelfPrice(row.sellerPrice, row.priceMode, row.markupPercent, row.markupAmount),
      }));

      return reply.send({ partnerName: name, items });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Não foi possível carregar o catálogo.' });
    }
  });

  fastify.put('/api/partner/prices', { preHandler: requirePartner }, async (request, reply) => {
    const { userId, partnerId } = request.user;
    const { productId, mode, markupPercent, markupAmount } = request.body || {};
    if (!productId) {
      return reply.code(400).send({ error: 'Informe o produto.' });
    }
    const priceMode = mode === 'markup' || mode === 'amount' ? mode : 'seller';
    const markup = Math.max(0, Math.min(500, Number(markupPercent) || 0));
    const amount = Math.max(0, Number(markupAmount) || 0);

    try {
      const owned = await pool.query(
        `SELECT 1 FROM dispatches
         WHERE user_id = $1 AND partner_id = $2 AND product_id = $3 AND is_deleted = FALSE
         LIMIT 1`,
        [userId, partnerId, productId]
      );
      if (owned.rows.length === 0) {
        return reply.code(404).send({ error: 'Este produto não está consignado nesta loja.' });
      }

      await pool.query(
        `INSERT INTO partner_prices (user_id, partner_id, product_id, price_mode, markup_percent, markup_amount, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, partner_id, product_id) DO UPDATE SET
           price_mode = EXCLUDED.price_mode,
           markup_percent = EXCLUDED.markup_percent,
           markup_amount = EXCLUDED.markup_amount,
           updated_at = NOW()`,
        [userId, partnerId, productId, priceMode, markup, amount]
      );
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Não foi possível salvar o preço.' });
    }
  });

  fastify.post('/api/partner/sales', { preHandler: requirePartner }, async (request, reply) => {
    const { userId, partnerId } = request.user;
    const { items = [], paymentMethod } = request.body || {};
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return reply.code(400).send({ error: 'Escolha a forma de pagamento.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ error: 'Inclua ao menos um produto.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const sales = [];

      for (const item of items) {
        const quantity = Math.round(Number(item.quantity) || 0);
        if (!item.dispatchId || quantity < 1) {
          throw Object.assign(new Error('Item inválido.'), { statusCode: 400 });
        }

        const rowRes = await client.query(
          `SELECT d.id, d.product_id, d.unit_retail_price,
                  GREATEST(d.quantity_sent - d.quantity_sold, 0) AS available,
                  COALESCE(pp.price_mode, 'seller') AS price_mode,
                  COALESCE(pp.markup_percent, 0) AS markup_percent,
                  COALESCE(pp.markup_amount, 0) AS markup_amount
           FROM dispatches d
           LEFT JOIN partner_prices pp
             ON pp.user_id = d.user_id AND pp.partner_id = d.partner_id AND pp.product_id = d.product_id
           WHERE d.id = $1 AND d.user_id = $2 AND d.partner_id = $3 AND d.is_deleted = FALSE
           FOR UPDATE`,
          [item.dispatchId, userId, partnerId]
        );
        const row = rowRes.rows[0];
        if (!row) {
          throw Object.assign(new Error('Remessa não encontrada nesta loja.'), { statusCode: 404 });
        }
        if (quantity > Number(row.available)) {
          throw Object.assign(new Error('Quantidade maior que o estoque consignado.'), { statusCode: 409 });
        }

        const unitPrice = shelfPrice(row.unit_retail_price, row.price_mode, row.markup_percent, row.markup_amount);
        const saleId = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        await client.query(
          `UPDATE dispatches
           SET quantity_sold = quantity_sold + $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3`,
          [quantity, row.id, userId]
        );
        await client.query(
          `INSERT INTO partner_sales (id, user_id, partner_id, product_id, dispatch_id, quantity, unit_price, payment_method, sold_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [saleId, userId, partnerId, row.product_id, row.id, quantity, unitPrice, paymentMethod]
        );
        sales.push({ id: saleId, dispatchId: row.id, productId: row.product_id, quantity, unitPrice, paymentMethod });
      }

      await client.query('COMMIT');
      return reply.code(201).send({ sales });
    } catch (err) {
      await client.query('ROLLBACK');
      const status = err.statusCode || 500;
      if (status === 500) fastify.log.error(err);
      return reply.code(status).send({ error: status === 500 ? 'Não foi possível registrar a venda.' : err.message });
    } finally {
      client.release();
    }
  });
}
