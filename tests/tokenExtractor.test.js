import { extractToken, extractTokenWithContext } from '../src/tokenExtractor.js';

describe('Token Extractor', () => {

  describe('extractToken', () => {
    it('should extract Bearer token from Authorization header', () => {
      const req = {
        headers: {
          authorization: 'Bearer test-token-123',
        },
        cookies: {},
      };
      const result = extractToken(req);
      expect(result.token).toBe('test-token-123');
      expect(result.source).toBe('header');
      expect(result.context).toBeNull();
    });

    it('should handle Bearer token with extra spaces', () => {
      const req = {
        headers: {
          authorization: 'Bearer   test-token-123  ',
        },
        cookies: {},
      };
      const result = extractToken(req);
      expect(result.token).toBe('test-token-123');
      expect(result.source).toBe('header');
    });

    it('should extract token from context-specific cookie when context is known', () => {
      const req = {
        headers: {
          origin: 'https://customer.bizpickr.cloud',
        },
        cookies: {
          customer_access_token: 'cookie-token',
        },
      };
      const result = extractToken(req, { preferContext: true });
      expect(result.token).toBe('cookie-token');
      expect(result.source).toBe('cookie');
      expect(result.context).toBe('customer');
    });

    it('should extract token from all contexts when context is unknown', () => {
      const req = {
        headers: {},
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractToken(req);
      expect(result.token).toBe('vendor-token');
      expect(result.source).toBe('cookie');
      expect(result.context).toBe('vendor');
    });

    it('should fallback to legacy cookies when context cookies not found', () => {
      const req = {
        headers: {},
        cookies: {
          accessToken: 'legacy-token',
        },
      };
      const result = extractToken(req);
      expect(result.token).toBe('legacy-token');
      expect(result.source).toBe('cookie');
      expect(result.context).toBeNull();
    });

    it('should try multiple legacy formats', () => {
      const req = {
        headers: {},
        cookies: {
          access_token: 'legacy-token',
        },
      };
      const result = extractToken(req);
      expect(result.token).toBe('legacy-token');
      expect(result.source).toBe('cookie');
    });

    it('should return null when no token found', () => {
      const req = {
        headers: {},
        cookies: {},
      };
      const result = extractToken(req);
      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
      expect(result.context).toBeNull();
    });

    it('should return null for invalid request', () => {
      expect(extractToken(null)).toEqual({
        token: null,
        source: null,
        context: null,
      });
    });

    it('should extract refresh token type', () => {
      const req = {
        headers: {
          origin: 'https://customer.bizpickr.cloud',
        },
        cookies: {
          customer_refresh_token: 'refresh-token',
        },
      };
      const result = extractToken(req, { tokenType: 'refresh' });
      expect(result.token).toBe('refresh-token');
      expect(result.context).toBe('customer');
    });

    it('should prioritize Bearer token over cookies', () => {
      const req = {
        headers: {
          authorization: 'Bearer header-token',
        },
        cookies: {
          customer_access_token: 'cookie-token',
        },
      };
      const result = extractToken(req);
      expect(result.token).toBe('header-token');
      expect(result.source).toBe('header');
    });

    it('should use custom context origins', () => {
      const customOrigins = {
        customer: ['http://custom-customer.com'],
      };
      const req = {
        headers: {
          origin: 'http://custom-customer.com',
        },
        cookies: {
          customer_access_token: 'token',
        },
      };
      const result = extractToken(req, { contextOrigins: customOrigins });
      expect(result.token).toBe('token');
      expect(result.context).toBe('customer');
    });

    it('should skip context resolution when preferContext is false', () => {
      const req = {
        headers: {},
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractToken(req, { preferContext: false });
      expect(result.token).toBe('vendor-token');
      expect(result.context).toBe('vendor');
    });
  });

  describe('extractTokenWithContext', () => {
    it('should extract token for expected context', () => {
      const req = {
        headers: {},
        cookies: {
          customer_access_token: 'customer-token',
        },
      };
      const result = extractTokenWithContext(req, 'customer');
      expect(result.token).toBe('customer-token');
      expect(result.source).toBe('cookie');
      expect(result.context).toBe('customer');
    });

    it('should return null when token not found for expected context', () => {
      const req = {
        headers: {},
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractTokenWithContext(req, 'customer');
      expect(result.token).toBeNull();
    });

    it('should extract Bearer token even with context mismatch', () => {
      const req = {
        headers: {
          authorization: 'Bearer header-token',
        },
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractTokenWithContext(req, 'customer');
      expect(result.token).toBe('header-token');
      expect(result.source).toBe('header');
      expect(result.context).toBeNull();
    });

    it('should return null for invalid expected context', () => {
      const req = {
        headers: {},
        cookies: {
          customer_access_token: 'token',
        },
      };
      expect(extractTokenWithContext(req, null)).toEqual({
        token: null,
        source: null,
        context: null,
      });
      expect(extractTokenWithContext(req, '')).toEqual({
        token: null,
        source: null,
        context: null,
      });
    });

    it('should extract different token types', () => {
      const req = {
        headers: {},
        cookies: {
          customer_refresh_token: 'refresh-token',
        },
      };
      const result = extractTokenWithContext(req, 'customer', { tokenType: 'refresh' });
      expect(result.token).toBe('refresh-token');
      expect(result.context).toBe('customer');
    });
  });
});
