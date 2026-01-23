/**
 * Token Extraction Utilities
 * 
 * Unified token extraction with context awareness.
 * Tries multiple sources in priority order:
 * 1. Bearer token (Authorization header) - Highest priority
 * 2. Context-specific cookie (if context is known)
 * 3. All context cookies (fallback)
 * 4. Legacy generic cookies (backward compatibility)
 * 
 * @module tokenExtractor
 */

import {
  extractTokenFromAllContexts,
  extractContextToken,
} from './cookieUtils.js';
import { resolveAuthContext } from './contextUtils.js';

/**
 * Extracts authentication token from request
 * 
 * Priority order:
 * 1. Bearer token from Authorization header
 * 2. Context-specific cookie (if context can be resolved)
 * 3. All context cookies (searches customer, vendor, admin)
 * 4. Legacy generic cookies (backward compatibility)
 * 
 * @param {Object} req - Express request object
 * @param {Object} [options={}] - Extraction options
 * @param {boolean} [options.preferContext=true] - Prefer context-specific cookies
 * @param {string} [options.tokenType='access'] - Token type to extract
 * @param {string} [options.nodeEnv='production'] - Node environment
 * @param {Object<string, string[]|string>} [options.contextOrigins] - Custom context origins mapping
 * @returns {Object} - { token: string|null, source: string|null, context: string|null }
 * 
 * @example
 * // Basic usage
 * const { token, source, context } = extractToken(req);
 * if (token) {
 *   // Use token
 * }
 * 
 * @example
 * // Extract refresh token
 * const { token } = extractToken(req, { tokenType: 'refresh' });
 * 
 * @example
 * // Custom context origins
 * const { token } = extractToken(req, {
 *   contextOrigins: customOrigins
 * });
 */
export function extractToken(req, options = {}) {
  // Input validation
  if (!req || typeof req !== 'object') {
    return {
      token: null,
      source: null,
      context: null,
    };
  }

  const {
    preferContext = true,
    tokenType = 'access',
    nodeEnv = 'production',
    contextOrigins,
  } = options;

  // 1. Try Bearer token first (highest priority)
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return {
        token,
        source: 'header',
        context: null,
      };
    }
  }

  // 2. Try context-specific cookie if context is known
  if (preferContext) {
    const context = resolveAuthContext(req, { nodeEnv, contextOrigins });
    if (context) {
      const token = extractContextToken(req, context, tokenType);
      if (token) {
        return {
          token,
          source: 'cookie',
          context,
        };
      }
    }
  }

  // 3. Fallback: Try all context cookies
  const { token, context } = extractTokenFromAllContexts(req, tokenType);
  if (token) {
    return {
      token,
      source: 'cookie',
      context,
    };
  }

  // 4. Legacy: Try generic cookie (backward compatibility)
  // Support multiple legacy formats
  const legacyFormats = [
    `${tokenType}Token`,
    tokenType,
    `${tokenType}_token`,
    'accessToken', // Common legacy format
    'access_token', // Common legacy format
  ];

  for (const format of legacyFormats) {
    const legacyToken = req.cookies?.[format];
    if (legacyToken) {
      return {
        token: legacyToken,
        source: 'cookie',
        context: null,
      };
    }
  }

  return {
    token: null,
    source: null,
    context: null,
  };
}

/**
 * Extracts token with strict context validation
 * 
 * Only returns token if it matches the expected context.
 * Useful for enforcing context isolation.
 * 
 * @param {Object} req - Express request object
 * @param {string} expectedContext - Expected context (customer/vendor/admin)
 * @param {Object} [options={}] - Extraction options
 * @param {string} [options.tokenType='access'] - Token type to extract
 * @returns {Object} - { token: string|null, source: string|null, context: string|null }
 * 
 * @example
 * // Only get token if it's from customer context
 * const { token } = extractTokenWithContext(req, 'customer');
 */
export function extractTokenWithContext(req, expectedContext, options = {}) {
  if (!expectedContext || typeof expectedContext !== 'string') {
    return {
      token: null,
      source: null,
      context: null,
    };
  }

  const { tokenType = 'access' } = options;

  // Try context-specific cookie first
  const token = extractContextToken(req, expectedContext, tokenType);
  if (token) {
    return {
      token,
      source: 'cookie',
      context: expectedContext,
    };
  }

  // Try Bearer token (no context validation for header tokens)
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) {
      return {
        token: bearerToken,
        source: 'header',
        context: null, // Bearer tokens don't have context in cookie
      };
    }
  }

  return {
    token: null,
    source: null,
    context: null,
  };
}
