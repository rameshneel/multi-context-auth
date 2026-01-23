import {
  extractContextToken,
  extractTokenFromAllContexts,
  getCookieName,
  extractContextTokens,
  isValidTokenType,
  getValidTokenTypes,
  VALID_TOKEN_TYPES,
} from '../src/cookieUtils.js';

describe('Cookie Utils', () => {
  describe('getCookieName', () => {
    it('should generate correct cookie name for customer access token', () => {
      expect(getCookieName('customer', 'access')).toBe('customer_access_token');
    });

    it('should generate correct cookie name for vendor refresh token', () => {
      expect(getCookieName('vendor', 'refresh')).toBe('vendor_refresh_token');
    });

    it('should generate correct cookie name for admin signup token', () => {
      expect(getCookieName('admin', 'signup')).toBe('admin_signup_token');
    });

    it('should default to access token type', () => {
      expect(getCookieName('customer')).toBe('customer_access_token');
    });

    it('should throw error for invalid context', () => {
      expect(() => getCookieName(null, 'access')).toThrow('Context must be a non-empty string');
      expect(() => getCookieName('', 'access')).toThrow('Context must be a non-empty string');
    });

    it('should throw error for invalid token type', () => {
      expect(() => getCookieName('customer', null)).toThrow('Token type must be a non-empty string');
      expect(() => getCookieName('customer', '')).toThrow('Token type must be a non-empty string');
    });
  });

  describe('extractContextToken', () => {
    it('should extract token from context-specific cookie', () => {
      const req = {
        cookies: {
          customer_access_token: 'test-token-123',
        },
      };
      expect(extractContextToken(req, 'customer', 'access')).toBe('test-token-123');
    });

    it('should return null for missing cookie', () => {
      const req = {
        cookies: {},
      };
      expect(extractContextToken(req, 'customer', 'access')).toBeNull();
    });

    it('should return null for invalid request object', () => {
      expect(extractContextToken(null, 'customer', 'access')).toBeNull();
      expect(extractContextToken({}, 'customer', 'access')).toBeNull();
    });

    it('should return null for invalid context', () => {
      const req = {
        cookies: {
          customer_access_token: 'test-token',
        },
      };
      expect(extractContextToken(req, 'invalid', 'access')).toBeNull();
      expect(extractContextToken(req, null, 'access')).toBeNull();
    });

    it('should extract different token types', () => {
      const req = {
        cookies: {
          vendor_refresh_token: 'refresh-token',
          vendor_signup_token: 'signup-token',
          vendor_otp_token: 'otp-token',
        },
      };
      expect(extractContextToken(req, 'vendor', 'refresh')).toBe('refresh-token');
      expect(extractContextToken(req, 'vendor', 'signup')).toBe('signup-token');
      expect(extractContextToken(req, 'vendor', 'otp')).toBe('otp-token');
    });
  });

  describe('extractTokenFromAllContexts', () => {
    it('should find token in customer context', () => {
      const req = {
        cookies: {
          customer_access_token: 'customer-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access');
      expect(result.token).toBe('customer-token');
      expect(result.context).toBe('customer');
    });

    it('should find token in vendor context', () => {
      const req = {
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access');
      expect(result.token).toBe('vendor-token');
      expect(result.context).toBe('vendor');
    });

    it('should find token in admin context', () => {
      const req = {
        cookies: {
          admin_access_token: 'admin-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access');
      expect(result.token).toBe('admin-token');
      expect(result.context).toBe('admin');
    });

    it('should return null when no token found', () => {
      const req = {
        cookies: {},
      };
      const result = extractTokenFromAllContexts(req, 'access');
      expect(result.token).toBeNull();
      expect(result.context).toBeNull();
    });

    it('should return null for invalid request', () => {
      expect(extractTokenFromAllContexts(null, 'access')).toEqual({
        token: null,
        context: null,
      });
    });

    it('should prioritize first found context', () => {
      const req = {
        cookies: {
          customer_access_token: 'customer-token',
          vendor_access_token: 'vendor-token',
          admin_access_token: 'admin-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access');
      expect(result.token).toBe('customer-token');
      expect(result.context).toBe('customer');
    });

    it('should work with custom contexts array', () => {
      const req = {
        cookies: {
          vendor_access_token: 'vendor-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access', ['vendor', 'admin']);
      expect(result.token).toBe('vendor-token');
      expect(result.context).toBe('vendor');
    });

    it('should filter invalid contexts', () => {
      const req = {
        cookies: {
          customer_access_token: 'customer-token',
        },
      };
      const result = extractTokenFromAllContexts(req, 'access', ['invalid', 'customer']);
      expect(result.token).toBe('customer-token');
      expect(result.context).toBe('customer');
    });
  });

  describe('extractContextTokens', () => {
    it('should extract multiple token types', () => {
      const req = {
        cookies: {
          customer_access_token: 'access-token',
          customer_refresh_token: 'refresh-token',
        },
      };
      const result = extractContextTokens(req, 'customer', ['access', 'refresh']);
      expect(result.access).toBe('access-token');
      expect(result.refresh).toBe('refresh-token');
    });

    it('should return empty object for invalid request', () => {
      expect(extractContextTokens(null, 'customer', ['access'])).toEqual({});
    });

    it('should return empty object for invalid context', () => {
      const req = {
        cookies: {
          customer_access_token: 'token',
        },
      };
      expect(extractContextTokens(req, null, ['access'])).toEqual({});
    });

    it('should return empty object for invalid token types array', () => {
      const req = {
        cookies: {
          customer_access_token: 'token',
        },
      };
      expect(extractContextTokens(req, 'customer', null)).toEqual({});
      expect(extractContextTokens(req, 'customer', 'not-array')).toEqual({});
    });

    it('should default to access and refresh tokens', () => {
      const req = {
        cookies: {
          customer_access_token: 'access-token',
          customer_refresh_token: 'refresh-token',
        },
      };
      const result = extractContextTokens(req, 'customer');
      expect(result.access).toBe('access-token');
      expect(result.refresh).toBe('refresh-token');
    });

    it('should handle missing tokens gracefully', () => {
      const req = {
        cookies: {
          customer_access_token: 'access-token',
        },
      };
      const result = extractContextTokens(req, 'customer', ['access', 'refresh', 'signup']);
      expect(result.access).toBe('access-token');
      expect(result.refresh).toBeNull();
      expect(result.signup).toBeNull();
    });
  });

  describe('isValidTokenType', () => {
    it('should validate valid token types', () => {
      expect(isValidTokenType('access')).toBe(true);
      expect(isValidTokenType('refresh')).toBe(true);
      expect(isValidTokenType('signup')).toBe(true);
      expect(isValidTokenType('otp')).toBe(true);
      expect(isValidTokenType('password_reset')).toBe(true);
    });

    it('should reject invalid token types', () => {
      expect(isValidTokenType('invalid')).toBe(false);
      expect(isValidTokenType('')).toBe(false);
      expect(isValidTokenType(null)).toBe(false);
    });
  });

  describe('getValidTokenTypes', () => {
    it('should return array of valid token types', () => {
      const types = getValidTokenTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('access');
      expect(types).toContain('refresh');
    });
  });

  describe('VALID_TOKEN_TYPES', () => {
    it('should be exported and contain valid types', () => {
      expect(VALID_TOKEN_TYPES).toBeDefined();
      expect(Array.isArray(VALID_TOKEN_TYPES)).toBe(true);
      expect(VALID_TOKEN_TYPES).toContain('access');
      expect(VALID_TOKEN_TYPES).toContain('refresh');
    });
  });
});
