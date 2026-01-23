/**
 * Context-Scoped Cookie Utilities
 * 
 * Handles extraction and management of context-specific cookies
 * following the pattern: {context}_{tokenType}_token
 * 
 * @module cookieUtils
 */

import { VALID_CONTEXTS } from './contextUtils.js';

/**
 * Token types supported by the system
 * @type {readonly string[]}
 */
const VALID_TOKEN_TYPES = Object.freeze([
  'access',
  'refresh',
  'signup',
  'otp',
  'password_reset',
]);

/**
 * Extracts token from context-specific cookie
 * 
 * Cookie naming pattern: {context}_{tokenType}_token
 * Examples:
 * - customer_access_token
 * - vendor_refresh_token
 * - admin_signup_token
 * 
 * @param {Object} req - Express request object
 * @param {string} context - Context (customer/vendor/admin)
 * @param {string} [tokenType='access'] - Token type (access/refresh/signup/otp/password_reset)
 * @returns {string|null} - Token value or null
 * 
 * @example
 * const token = extractContextToken(req, 'customer', 'access');
 * // Gets: customer_access_token cookie value
 * 
 * @example
 * const refreshToken = extractContextToken(req, 'vendor', 'refresh');
 * // Gets: vendor_refresh_token cookie value
 */
export function extractContextToken(req, context, tokenType = 'access') {
  // Input validation
  if (!req || typeof req !== 'object') {
    return null;
  }

  if (!context || typeof context !== 'string') {
    return null;
  }

  if (!VALID_CONTEXTS.includes(context)) {
    return null;
  }

  if (!req.cookies || typeof req.cookies !== 'object') {
    return null;
  }

  const cookieName = getCookieName(context, tokenType);
  return req.cookies[cookieName] || null;
}

/**
 * Extracts token from all possible context cookies
 * 
 * Tries each context in order until a token is found.
 * Useful when context is unknown.
 * 
 * @param {Object} req - Express request object
 * @param {string} [tokenType='access'] - Token type (access/refresh/signup/otp/password_reset)
 * @param {string[]} [contexts=VALID_CONTEXTS] - Array of contexts to check
 * @returns {Object} - { token: string|null, context: string|null }
 * 
 * @example
 * const { token, context } = extractTokenFromAllContexts(req, 'access');
 * // Returns: { token: '...', context: 'customer' } or { token: null, context: null }
 */
export function extractTokenFromAllContexts(
  req,
  tokenType = 'access',
  contexts = VALID_CONTEXTS
) {
  if (!req || typeof req !== 'object') {
    return { token: null, context: null };
  }

  if (!req.cookies || typeof req.cookies !== 'object') {
    return { token: null, context: null };
  }

  // Validate contexts array
  const validContexts = Array.isArray(contexts)
    ? contexts.filter(ctx => VALID_CONTEXTS.includes(ctx))
    : VALID_CONTEXTS;

  for (const context of validContexts) {
    const token = extractContextToken(req, context, tokenType);
    if (token) {
      return { token, context };
    }
  }

  return { token: null, context: null };
}

/**
 * Gets cookie name for context and token type
 * 
 * @param {string} context - Context (customer/vendor/admin)
 * @param {string} [tokenType='access'] - Token type (access/refresh/signup/otp/password_reset)
 * @returns {string} - Cookie name
 * 
 * @example
 * const cookieName = getCookieName('customer', 'access');
 * // Returns: 'customer_access_token'
 * 
 * @example
 * const cookieName = getCookieName('vendor', 'refresh');
 * // Returns: 'vendor_refresh_token'
 */
export function getCookieName(context, tokenType = 'access') {
  if (!context || typeof context !== 'string') {
    throw new Error('Context must be a non-empty string');
  }

  if (!tokenType || typeof tokenType !== 'string') {
    throw new Error('Token type must be a non-empty string');
  }

  return `${context}_${tokenType}_token`;
}

/**
 * Extracts multiple tokens for a context
 * 
 * @param {Object} req - Express request object
 * @param {string} context - Context
 * @param {string[]} [tokenTypes=['access', 'refresh']] - Array of token types to extract
 * @returns {Object} - Object with token types as keys and token values as values
 * 
 * @example
 * const tokens = extractContextTokens(req, 'customer', ['access', 'refresh']);
 * // Returns: { access: '...', refresh: '...' }
 */
export function extractContextTokens(
  req,
  context,
  tokenTypes = ['access', 'refresh']
) {
  if (!req || typeof req !== 'object') {
    return {};
  }

  if (!context || typeof context !== 'string') {
    return {};
  }

  if (!Array.isArray(tokenTypes)) {
    return {};
  }

  const tokens = {};

  for (const tokenType of tokenTypes) {
    if (typeof tokenType === 'string') {
      tokens[tokenType] = extractContextToken(req, context, tokenType);
    }
  }

  return tokens;
}

/**
 * Validates token type
 * 
 * @param {string} tokenType - Token type to validate
 * @returns {boolean} - True if token type is valid
 */
export function isValidTokenType(tokenType) {
  return VALID_TOKEN_TYPES.includes(tokenType);
}

/**
 * Gets all valid token types
 * 
 * @returns {readonly string[]} - Array of valid token types
 */
export function getValidTokenTypes() {
  return VALID_TOKEN_TYPES;
}

// Export constants
export { VALID_TOKEN_TYPES };
