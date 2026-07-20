/**
 * Audit Log Middleware Factory
 *
 * Usage: router.post('/some-route', auditAction('user.deactivated', 'user'), handler)
 *
 * The middleware runs AFTER the handler (via res.on('finish')) so it captures
 * the response's entity_id from res.locals.auditEntityId set by the handler.
 * This guarantees: no successful mutation goes unlogged, since it's structural.
 */

const { pool } = require('../services/db');
const logger = require('../utils/logger');

/**
 * @param {string} action      - dot-namespaced action, e.g. 'role.assigned'
 * @param {string} entityType  - entity being mutated, e.g. 'user', 'club'
 */
function auditAction(action, entityType) {
  return (req, res, next) => {
    // Attach a hook BEFORE the handler runs, fires on response completion
    res.on('finish', async () => {
      // Only log successful mutations (2xx responses)
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      // Only log if there's an authenticated actor
      if (!req.user?.id) return;

      try {
        await pool.query(
          `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, metadata, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user.id,
            action,
            entityType,
            res.locals.auditEntityId || null,
            res.locals.auditMetadata ? JSON.stringify(res.locals.auditMetadata) : null,
            req.ip || null,
          ]
        );
      } catch (err) {
        // Audit log failure must never crash the request — log it but swallow
        logger.error(`[AUDIT] Failed to write audit log entry: ${err.message}`, {
          action,
          entityType,
          actorId: req.user?.id,
        });
      }
    });

    next();
  };
}

module.exports = { auditAction };
