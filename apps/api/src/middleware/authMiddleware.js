const { verifyJwt } = require("../services/authService");

/**
 * Express middleware that verifies JWT from the Authorization header.
 * On success, attaches req.user = { id, email, roles }.
 * On failure, responds with 401.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles || [],
  };

  next();
}

/**
 * Middleware that checks if the authenticated user has any of the given roles.
 * Must be used after requireAuth.
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const hasAccess = req.user.roles.some((r) => {
      const roleName = typeof r === 'string' ? r : (r.name || r);
      return allowedRoles.includes(roleName);
    });
    if (!hasAccess) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware that restricts access to users with the 'platform_admin' role.
 * Returns 403 (not 404) on failure — this is intentionally hidden, not missing.
 * Must be used after requireAuth.
 */
function requirePlatformAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!req.user.roles.includes('platform_admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/**
 * Express middleware that verifies JWT if present.
 * Does not fail if missing or invalid, just leaves req.user undefined.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (token) {
    const payload = verifyJwt(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
      };
    }
  }

  next();
}

module.exports = { requireAuth, requireRoles, requirePlatformAdmin, optionalAuth };
