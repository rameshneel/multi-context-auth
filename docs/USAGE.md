# Usage Examples

## Express Middleware Integration

### Basic Authentication Middleware

```javascript
import { extractToken } from '@bizpickr/auth-context';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL));

export const authMiddleware = async (req, res, next) => {
  try {
    const { token, source, context } = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { payload } = await jwtVerify(token, JWKS);

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

### Context-Aware Middleware

```javascript
import { extractToken, resolveAuthContext } from '@bizpickr/auth-context';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL));

export const contextAwareAuth = async (req, res, next) => {
  try {
    const { token, context: tokenContext } = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { payload } = await jwtVerify(token, JWKS);

    // Resolve expected context from request
    const expectedContext = resolveAuthContext(req);

    // Validate context match
    if (expectedContext && payload.type !== expectedContext) {
      return res.status(403).json({
        error: `Token type ${payload.type} does not match context ${expectedContext}`,
      });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      type: payload.type,
      context: tokenContext || expectedContext || payload.type,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Context-Specific Token Extraction

```javascript
import { extractContextToken } from '@bizpickr/auth-context';

export const getCustomerToken = (req) => {
  return extractContextToken(req, 'customer', 'access');
};

export const getVendorRefreshToken = (req) => {
  return extractContextToken(req, 'vendor', 'refresh');
};
```

## Custom Context Origins

```javascript
import { resolveAuthContext } from '@bizpickr/auth-context';

const customOrigins = {
  admin: [
    'https://admin.example.com',
    'https://admin-staging.example.com',
  ],
  vendor: [
    'https://vendor.example.com',
    'https://partner.example.com',
  ],
  customer: [
    'https://app.example.com',
    'https://www.example.com',
  ],
};

const context = resolveAuthContext(req, {
  contextOrigins: customOrigins,
  nodeEnv: process.env.NODE_ENV,
});
```

## Error Handling

```javascript
import { extractToken } from '@bizpickr/auth-context';

export const safeExtractToken = (req) => {
  try {
    const result = extractToken(req);
    
    if (!result.token) {
      return {
        error: 'NO_TOKEN',
        message: 'No authentication token found',
      };
    }

    return {
      success: true,
      token: result.token,
      source: result.source,
      context: result.context,
    };
  } catch (error) {
    return {
      error: 'EXTRACTION_ERROR',
      message: error.message,
    };
  }
};
```

## Multiple Token Types

```javascript
import { extractContextTokens } from '@bizpickr/auth-context';

export const getAllCustomerTokens = (req) => {
  return extractContextTokens(req, 'customer', [
    'access',
    'refresh',
    'signup',
    'otp',
  ]);
};

// Returns:
// {
//   access: '...',
//   refresh: '...',
//   signup: '...',
//   otp: '...'
// }
```
