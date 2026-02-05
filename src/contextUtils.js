/**
 * Context Resolution Utilities
 * 
 * Resolves user context (customer/vendor/admin) from:
 * - Request origin header
 * - Referer header  
 * - Custom X-Auth-Context header (dev only)
 * 
 * @module contextUtils
 */

/**
 * Default context origins mapping
 * Maps each context to allowed origin URLs
 * @type {Object<string, string[]|string>}
 */
const DEFAULT_CONTEXT_ORIGINS = {
  admin: [
    'https://admin.example.com',
    'http://localhost:4202',
  ],
  vendor: [
    'https://vendor.example.com',
    'http://localhost:4201',
  ],
  customer: [
    'https://customer.example.com',
    'https://app.example.com',
    'http://localhost:3000',
    'http://localhost:4200',
  ],
};

/**
 * Valid context types
 * @type {readonly string[]}
 */
const VALID_CONTEXTS = Object.freeze(['customer', 'vendor', 'admin']);

/**
 * Resolves authentication context from request
 * 
 * Priority order:
 * 1. Origin header
 * 2. Referer header
 * 3. X-Auth-Context header (dev only)
 * 
 * @param {Object} req - Express request object
 * @param {Object} [options={}] - Configuration options
 * @param {string} [options.nodeEnv='production'] - Node environment
 * @param {Object<string, string[]|string>} [options.contextOrigins] - Custom context origins mapping
 * @returns {string|null} - Resolved context ('customer' | 'vendor' | 'admin') or null
 * 
 * @example
 * const context = resolveAuthContext(req);
 * // Returns: 'customer' | 'vendor' | 'admin' | null
 * 
 * @example
 * const context = resolveAuthContext(req, {
 *   nodeEnv: 'development',
 *   contextOrigins: customOrigins
 * });
 */
export function resolveAuthContext(req, options = {}) {
  if (!req || typeof req !== 'object') {
    return null;
  }

  const {
    nodeEnv = 'production',
    contextOrigins = DEFAULT_CONTEXT_ORIGINS,
  } = options;

  // 1. Try origin header first (most reliable)
  const origin = req.headers?.origin;
  if (origin) {
    const context = getContextFromOrigin(origin, contextOrigins);
    if (context) return context;
  }

  // 2. Try referer header (fallback)
  const referer = req.headers?.referer || req.headers?.referrer;
  if (referer) {
    const context = getContextFromOrigin(referer, contextOrigins);
    if (context) return context;
  }

  // 3. Dev mode: Allow header override for testing
  if (nodeEnv === 'development') {
    const customContext = req.headers?.['x-auth-context'];
    if (customContext && isValidContext(customContext, contextOrigins)) {
      return customContext;
    }
  }

  return null;
}

/**
 * Gets context from URL origin
 * 
 * @private
 * @param {string} url - URL string
 * @param {Object<string, string[]|string>} contextOrigins - Context origins mapping
 * @returns {string|null} - Context or null
 */
function getContextFromOrigin(url, contextOrigins) {
  if (!url || typeof url !== 'string') return null;

  let requestOrigin;
  try {
    requestOrigin = new URL(url).origin;
  } catch {
    return null;
  }

  for (const [context, allowedOrigins] of Object.entries(contextOrigins)) {
    const origins = Array.isArray(allowedOrigins)
      ? allowedOrigins
      : [allowedOrigins];

    if (origins.includes(requestOrigin)) {
      return context;
    }
  }

  return null;
}

/**
 * Validates if context is valid
 * 
 * @private
 * @param {string} context - Context to validate
 * @param {Object<string, string[]|string>} contextOrigins - Context origins mapping
 * @returns {boolean} - True if context is valid
 */
function isValidContext(context, contextOrigins) {
  return (
    typeof context === 'string' &&
    Object.keys(contextOrigins).includes(context)
  );
}

/**
 * Maps user type to context
 * 
 * @param {string} type - User type (customer/vendor/admin)
 * @returns {string|null} - Mapped context or null
 * 
 * @example
 * const context = getContextFromType('customer');
 * // Returns: 'customer'
 * 
 * @example
 * const context = getContextFromType('invalid');
 * // Returns: null
 */
export function getContextFromType(type) {
  if (!type || typeof type !== 'string') {
    return null;
  }

  return VALID_CONTEXTS.includes(type) ? type : null;
}

/**
 * Checks if origin is allowed for given context
 * 
 * @param {string} origin - Request origin URL
 * @param {string} context - Context to check
 * @param {Object<string, string[]|string>} [contextOrigins=DEFAULT_CONTEXT_ORIGINS] - Context origins mapping
 * @returns {boolean} - True if origin is allowed
 * 
 * @example
 * const allowed = isOriginAllowedForContext(
 *   'https://customer.example.com',
 *   'customer'
 * );
 * // Returns: true
 */
export function isOriginAllowedForContext(
  origin,
  context,
  contextOrigins = DEFAULT_CONTEXT_ORIGINS
) {
  if (!origin || !context || typeof origin !== 'string' || typeof context !== 'string') {
    return false;
  }

  const allowedOrigins = contextOrigins[context];
  if (!allowedOrigins) return false;

  let requestOrigin;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  const origins = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : [allowedOrigins];

  return origins.includes(requestOrigin);
}

/**
 * Gets all valid contexts
 * 
 * @param {Object<string, string[]|string>} [contextOrigins=DEFAULT_CONTEXT_ORIGINS] - Context origins mapping
 * @returns {readonly string[]} - Array of valid contexts
 * 
 * @example
 * const contexts = getValidContexts();
 * // Returns: ['admin', 'vendor', 'customer']
 */
export function getValidContexts(contextOrigins = DEFAULT_CONTEXT_ORIGINS) {
  return Object.freeze(Object.keys(contextOrigins));
}

/**
 * Validates if a context string is valid
 * 
 * @param {string} context - Context to validate
 * @returns {boolean} - True if context is valid
 * 
 * @example
 * isValidContextType('customer'); // Returns: true
 * isValidContextType('invalid');  // Returns: false
 */
export function isValidContextType(context) {
  return VALID_CONTEXTS.includes(context);
}

// Export default context origins for customization
export { DEFAULT_CONTEXT_ORIGINS, VALID_CONTEXTS };
