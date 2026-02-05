/**
 * multi-context-auth
 * 
 * Context-Scoped Authentication Utilities
 * 
 * Provides utilities for:
 * - Context resolution from request headers/origin
 * - Context-scoped cookie management
 * - Token extraction with context awareness
 * - Multi-tenant cookie isolation
 * 
 * @module multi-context-auth
 * @version 1.0.0
 * 
 * @example
 * // Basic token extraction
 * import { extractToken } from 'multi-context-auth';
 * 
 * const { token, source, context } = extractToken(req);
 * if (token) {
 *   // Use token for authentication
 * }
 * 
 * @example
 * // Context resolution
 * import { resolveAuthContext } from 'multi-context-auth';
 * 
 * const context = resolveAuthContext(req);
 * // Returns: 'customer' | 'vendor' | 'admin' | null
 * 
 * @example
 * // Context-specific token extraction
 * import { extractContextToken } from 'multi-context-auth';
 * 
 * const token = extractContextToken(req, 'customer', 'access');
 * // Gets: customer_access_token cookie
 */

// Export all utilities
export * from './cookieUtils.js';
export * from './contextUtils.js';
export * from './tokenExtractor.js';

// Convenience exports with cleaner names
export { extractToken as getAuthToken } from './tokenExtractor.js';
export { resolveAuthContext as getContext } from './contextUtils.js';
export { extractContextToken as getContextToken } from './cookieUtils.js';
export { extractTokenFromAllContexts as getAllContextTokens } from './cookieUtils.js';
export { getCookieName as getContextCookieName } from './cookieUtils.js';
export { getContextFromType as mapTypeToContext } from './contextUtils.js';
export { isValidContextType as isValidContext } from './contextUtils.js';
export { isOriginAllowedForContext as validateOrigin } from './contextUtils.js';
