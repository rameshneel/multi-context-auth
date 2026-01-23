# bizpickr-auth-context

[![npm version](https://img.shields.io/npm/v/bizpickr-auth-context.svg)](https://www.npmjs.com/package/bizpickr-auth-context)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Context-scoped authentication utilities for BizPickr microservices. Handles multi-tenant cookie isolation, context resolution, and token extraction.

## Features

- 🔐 **Context-aware token extraction** - Automatically resolves context from request headers
- 🍪 **Multi-tenant cookie isolation** - Prevents cookie conflicts across user types
- 🌐 **Origin-based context resolution** - Determines context from request origin/referer
- 🔄 **Backward compatibility** - Supports legacy cookie formats
- 📦 **Zero dependencies** - Lightweight and fast
- 🎯 **Type-safe** - Full JSDoc documentation
- ✅ **Production-ready** - Used in production microservices

## Installation

```bash
npm install bizpickr-auth-context
```

## Quick Start

```javascript
import { extractToken, resolveAuthContext } from 'bizpickr-auth-context';

// Extract token with automatic context resolution
const { token, source, context } = extractToken(req);

if (token) {
  // Use token for authentication
  console.log(`Token from ${source}, context: ${context}`);
}

// Or resolve context separately
const context = resolveAuthContext(req);
// Returns: 'customer' | 'vendor' | 'admin' | null
```

## Usage

### Basic Token Extraction

```javascript
import { extractToken } from 'bizpickr-auth-context';

// Extracts token from:
// 1. Authorization header (Bearer token)
// 2. Context-specific cookie (customer_access_token, etc.)
// 3. All context cookies (fallback)
// 4. Legacy cookies (backward compatibility)

const { token, source, context } = extractToken(req);

if (!token) {
  return res.status(401).json({ error: 'Authentication required' });
}

// source: 'header' | 'cookie' | null
// context: 'customer' | 'vendor' | 'admin' | null
```

### Context Resolution

```javascript
import { resolveAuthContext } from 'bizpickr-auth-context';

// Resolves context from:
// 1. Origin header
// 2. Referer header
// 3. X-Auth-Context header (dev only)

const context = resolveAuthContext(req);
// Returns: 'customer' | 'vendor' | 'admin' | null
```

### Context-Specific Token Extraction

```javascript
import { extractContextToken } from 'bizpickr-auth-context';

// Extract token for specific context
const accessToken = extractContextToken(req, 'customer', 'access');
// Gets: customer_access_token cookie

const refreshToken = extractContextToken(req, 'vendor', 'refresh');
// Gets: vendor_refresh_token cookie
```

### Extract from All Contexts

```javascript
import { extractTokenFromAllContexts } from 'bizpickr-auth-context';

// Try all contexts until token is found
const { token, context } = extractTokenFromAllContexts(req, 'access');

if (token) {
  console.log(`Found ${context} token`);
}
```

### Custom Context Origins

```javascript
import { resolveAuthContext } from 'bizpickr-auth-context';

const customOrigins = {
  admin: ['https://admin.example.com'],
  vendor: ['https://vendor.example.com'],
  customer: ['https://app.example.com'],
};

const context = resolveAuthContext(req, {
  contextOrigins: customOrigins,
  nodeEnv: 'production',
});
```

### Express Middleware Example

```javascript
import { extractToken, resolveAuthContext } from 'bizpickr-auth-context';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL));

export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token with context awareness
    const { token, context } = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWKS);

    // Validate context match (optional but recommended)
    const resolvedContext = resolveAuthContext(req);
    if (resolvedContext && payload.type !== resolvedContext) {
      return res.status(403).json({
        error: `Token type ${payload.type} does not match context ${resolvedContext}`,
      });
    }

    // Attach user to request
    req.user = {
      id: payload.sub,
      role: payload.role,
      type: payload.type,
      context: context || payload.type,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## API Reference

### `extractToken(req, options?)`

Extracts authentication token from request with context awareness.

**Parameters:**
- `req` (Object): Express request object
- `options` (Object, optional):
  - `preferContext` (boolean): Prefer context-specific cookies (default: `true`)
  - `tokenType` (string): Token type to extract (default: `'access'`)
  - `nodeEnv` (string): Node environment (default: `'production'`)
  - `contextOrigins` (Object): Custom context origins mapping

**Returns:** `{ token: string|null, source: string|null, context: string|null }`

### `resolveAuthContext(req, options?)`

Resolves authentication context from request headers.

**Parameters:**
- `req` (Object): Express request object
- `options` (Object, optional):
  - `nodeEnv` (string): Node environment (default: `'production'`)
  - `contextOrigins` (Object): Custom context origins mapping

**Returns:** `string|null` - Context ('customer' | 'vendor' | 'admin') or null

### `extractContextToken(req, context, tokenType?)`

Extracts token from context-specific cookie.

**Parameters:**
- `req` (Object): Express request object
- `context` (string): Context ('customer' | 'vendor' | 'admin')
- `tokenType` (string, optional): Token type (default: `'access'`)

**Returns:** `string|null` - Token value or null

### `getCookieName(context, tokenType?)`

Gets cookie name for context and token type.

**Parameters:**
- `context` (string): Context ('customer' | 'vendor' | 'admin')
- `tokenType` (string, optional): Token type (default: `'access'`)

**Returns:** `string` - Cookie name (e.g., `'customer_access_token'`)

### `getContextFromType(type)`

Maps user type to context.

**Parameters:**
- `type` (string): User type

**Returns:** `string|null` - Mapped context or null

### `isOriginAllowedForContext(origin, context, contextOrigins?)`

Checks if origin is allowed for given context.

**Parameters:**
- `origin` (string): Request origin URL
- `context` (string): Context to check
- `contextOrigins` (Object, optional): Context origins mapping

**Returns:** `boolean` - True if origin is allowed

## Cookie Naming Convention

Cookies follow the pattern: `{context}_{tokenType}_token`

**Examples:**
- `customer_access_token` - Customer access token
- `vendor_refresh_token` - Vendor refresh token
- `admin_signup_token` - Admin signup token
- `customer_otp_token` - Customer OTP token
- `vendor_password_reset_token` - Vendor password reset token

## Supported Token Types

- `access` - Access tokens (JWT)
- `refresh` - Refresh tokens
- `signup` - Signup verification tokens
- `otp` - OTP verification tokens
- `password_reset` - Password reset tokens

## Context Resolution Priority

1. **Origin Header** - Most reliable, checked first
2. **Referer Header** - Fallback if origin not available
3. **X-Auth-Context Header** - Development/testing only

## Default Context Origins

```javascript
{
  admin: [
    'https://admin.bizpickr.cloud',
    'http://localhost:4202',
  ],
  vendor: [
    'https://vendor.bizpickr.cloud',
    'http://localhost:4201',
  ],
  customer: [
    'https://customer.bizpickr.cloud',
    'https://bizpickr.cloud',
    'http://localhost:3000',
    'http://localhost:4200',
  ],
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/rameshneel/bizpickr-auth-context/issues).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for details.
