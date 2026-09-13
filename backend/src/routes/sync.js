import { pool } from '../db/pool.js';

export async function syncRoutes(fastify, options) {
  fastify.post('/api/sync', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.code(401).send({ error: 'Não autorizado. Faça login para sincronizar.' });
      }
    }
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { lastSyncedAt, mutations = [] } = request.body || {};

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Processa cada mutação enviada pelo cliente
      for (const m of mutations) {
        const { table, action, data, id } = m;

        if (table === 'printers') {
          if (action === 'UPSERT' && data) {
            await client.query(`
              INSERT INTO printers (id, user_id, name, watts, price, lifespan_hours, maintenance_per_hour, updated_at, is_deleted)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), FALSE)
              ON CONFLICT (id, user_id) DO UPDATE SET
                name = EXCLUDED.name,
                watts = EXCLUDED.watts,
                price = EXCLUDED.price,
                lifespan_hours = EXCLUDED.lifespan_hours,
                maintenance_per_hour = EXCLUDED.maintenance_per_hour,
                updated_at = NOW(),
                is_deleted = FALSE
            `, [data.id, userId, data.name, data.watts || 0, data.price || 0, data.lifespanHours || 3000, data.maintenancePerHour || 0]);
          } else if (action === 'DELETE' && id) {
            await client.query(`
              UPDATE printers SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2
            `, [id, userId]);
          }
        }

        if (table === 'filaments') {
          if (action === 'UPSERT' && data) {
            await client.query(`
              INSERT INTO filaments (id, user_id, name, brand, material, color, spool_weight, price, updated_at, is_deleted)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), FALSE)
              ON CONFLICT (id, user_id) DO UPDATE SET
                name = EXCLUDED.name,
                brand = EXCLUDED.brand,
                material = EXCLUDED.material,
                color = EXCLUDED.color,
                spool_weight = EXCLUDED.spool_weight,
                price = EXCLUDED.price,
                updated_at = NOW(),
                is_deleted = FALSE
            `, [data.id, userId, data.name, data.brand, data.material, data.color, data.spoolWeight || 1000, data.price || 0]);
          } else if (action === 'DELETE' && id) {
            await client.query(`
              UPDATE filaments SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2
            `, [id, userId]);
          }
        }

        if (table === 'settings' && data) {
          await client.query(`
            INSERT INTO settings (user_id, energy_kwh_rate, labor_hourly_rate, prep_minutes_default, post_minutes_default, failure_margin_default, markup_default, currency_symbol, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              energy_kwh_rate = EXCLUDED.energy_kwh_rate,
              labor_hourly_rate = EXCLUDED.labor_hourly_rate,
              prep_minutes_default = EXCLUDED.prep_minutes_default,
              post_minutes_default = EXCLUDED.post_minutes_default,
              failure_margin_default = EXCLUDED.failure_margin_default,
              markup_default = EXCLUDED.markup_default,
              currency_symbol = EXCLUDED.currency_symbol,
              updated_at = NOW()
          `, [
            userId,
            data.energyKwhRate || 0.85,
            data.laborHourlyRate || 25,
            data.prepMinutesDefault || 10,
            data.postMinutesDefault || 15,
            data.failureMarginDefault || 10,
            data.markupDefault || 100,
            data.currencySymbol || 'R$'
          ]);
        }

        if (table === 'products') {
          if (action === 'UPSERT' && data) {
            await client.query(`
              INSERT INTO products (id, user_id, title, description, category, image_url, weight_grams, print_hours, print_minutes, filament_id, filament_name, printer_id, printer_name, cost, suggested_price, direct_sale_price, stock, infill, layer_height, updated_at, is_deleted)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), FALSE)
              ON CONFLICT (id, user_id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                image_url = EXCLUDED.image_url,
                weight_grams = EXCLUDED.weight_grams,
                print_hours = EXCLUDED.print_hours,
                print_minutes = EXCLUDED.print_minutes,
                filament_id = EXCLUDED.filament_id,
                filament_name = EXCLUDED.filament_name,
                printer_id = EXCLUDED.printer_id,
                printer_name = EXCLUDED.printer_name,
                cost = EXCLUDED.cost,
                suggested_price = EXCLUDED.suggested_price,
                direct_sale_price = EXCLUDED.direct_sale_price,
                stock = EXCLUDED.stock,
                infill = EXCLUDED.infill,
                layer_height = EXCLUDED.layer_height,
                updated_at = NOW(),
                is_deleted = FALSE
            `, [
              data.id, userId, data.title, data.description, data.category, data.imageUrl,
              data.weightGrams || 0, data.printHours || 0, data.printMinutes || 0,
              data.filamentId, data.filamentName, data.printerId, data.printerName,
              data.cost || 0, data.suggestedPrice || 0, data.directSalePrice || 0,
              data.stock || 0, data.infill, data.layerHeight
            ]);
          } else if (action === 'DELETE' && id) {
            await client.query(`
              UPDATE products SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2
            `, [id, userId]);
          }
        }

        if (table === 'partners') {
          if (action === 'UPSERT' && data) {
            await client.query(`
              INSERT INTO partners (id, user_id, name, contact_person, phone, commission_percent, address, notes, updated_at, is_deleted)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), FALSE)
              ON CONFLICT (id, user_id) DO UPDATE SET
                name = EXCLUDED.name,
                contact_person = EXCLUDED.contact_person,
                phone = EXCLUDED.phone,
                commission_percent = EXCLUDED.commission_percent,
                address = EXCLUDED.address,
                notes = EXCLUDED.notes,
                updated_at = NOW(),
                is_deleted = FALSE
            `, [data.id, userId, data.name, data.contactPerson, data.phone, data.commissionPercent || 0, data.address, data.notes]);
          } else if (action === 'DELETE' && id) {
            await client.query(`
              UPDATE partners SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2
            `, [id, userId]);
          }
        }

        if (table === 'dispatches') {
          if (action === 'UPSERT' && data) {
            await client.query(`
              INSERT INTO dispatches (id, user_id, partner_id, product_id, quantity_sent, quantity_sold, unit_retail_price, commission_percent, date_sent, notes, updated_at, is_deleted)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), FALSE)
              ON CONFLICT (id, user_id) DO UPDATE SET
                partner_id = EXCLUDED.partner_id,
                product_id = EXCLUDED.product_id,
                quantity_sent = EXCLUDED.quantity_sent,
                quantity_sold = EXCLUDED.quantity_sold,
                unit_retail_price = EXCLUDED.unit_retail_price,
                commission_percent = EXCLUDED.commission_percent,
                date_sent = EXCLUDED.date_sent,
                notes = EXCLUDED.notes,
                updated_at = NOW(),
                is_deleted = FALSE
            `, [
              data.id, userId, data.partnerId, data.productId,
              data.quantitySent || 0, data.quantitySold || 0,
              data.unitRetailPrice || 0, data.commissionPercent || 0,
              data.dateSent || new Date().toISOString(), data.notes
            ]);
          } else if (action === 'DELETE' && id) {
            await client.query(`
              UPDATE dispatches SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2
            `, [id, userId]);
          }
        }
      }

      await client.query('COMMIT');

      // 2. Busca alterações do servidor para devolver ao cliente
      // Se lastSyncedAt for null, traz tudo que não está deletado
      const filterClause = lastSyncedAt ? 'AND updated_at > $2' : 'AND is_deleted = FALSE';
      const params = lastSyncedAt ? [userId, new Date(lastSyncedAt)] : [userId];

      const printersRes = await client.query(
        `SELECT id, name, watts, price, lifespan_hours as "lifespanHours", maintenance_per_hour as "maintenancePerHour", updated_at as "updatedAt", is_deleted as "isDeleted" FROM printers WHERE user_id = $1 ${filterClause}`,
        params
      );

      const filamentsRes = await client.query(
        `SELECT id, name, brand, material, color, spool_weight as "spoolWeight", price, updated_at as "updatedAt", is_deleted as "isDeleted" FROM filaments WHERE user_id = $1 ${filterClause}`,
        params
      );

      const settingsRes = await client.query(
        `SELECT energy_kwh_rate as "energyKwhRate", labor_hourly_rate as "laborHourlyRate", prep_minutes_default as "prepMinutesDefault", post_minutes_default as "postMinutesDefault", failure_margin_default as "failureMarginDefault", markup_default as "markupDefault", currency_symbol as "currencySymbol", updated_at as "updatedAt" FROM settings WHERE user_id = $1`,
        [userId]
      );

      const productsRes = await client.query(
        `SELECT id, title, description, category, image_url as "imageUrl", weight_grams as "weightGrams", print_hours as "printHours", print_minutes as "printMinutes", filament_id as "filamentId", filament_name as "filamentName", printer_id as "printerId", printer_name as "printerName", cost, suggested_price as "suggestedPrice", direct_sale_price as "directSalePrice", stock, infill, layer_height as "layerHeight", updated_at as "updatedAt", is_deleted as "isDeleted" FROM products WHERE user_id = $1 ${filterClause}`,
        params
      );

      const partnersRes = await client.query(
        `SELECT id, name, contact_person as "contactPerson", phone, commission_percent as "commissionPercent", address, notes, updated_at as "updatedAt", is_deleted as "isDeleted" FROM partners WHERE user_id = $1 ${filterClause}`,
        params
      );

      const dispatchesRes = await client.query(
        `SELECT id, partner_id as "partnerId", product_id as "productId", quantity_sent as "quantitySent", quantity_sold as "quantitySold", unit_retail_price as "unitRetailPrice", commission_percent as "commissionPercent", date_sent as "dateSent", notes, updated_at as "updatedAt", is_deleted as "isDeleted" FROM dispatches WHERE user_id = $1 ${filterClause}`,
        params
      );

      return reply.send({
        serverTimestamp: new Date().toISOString(),
        updates: {
          printers: printersRes.rows,
          filaments: filamentsRes.rows,
          settings: settingsRes.rows[0] || null,
          products: productsRes.rows,
          partners: partnersRes.rows,
          dispatches: dispatchesRes.rows,
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Erro durante a sincronização dos dados.' });
    } finally {
      client.release();
    }
  });
}
