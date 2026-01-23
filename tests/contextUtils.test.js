/**
 * Context Utils Tests
 * 
 * Example test file structure
 * Run with: npm test
 */

import { describe, test, expect } from '@jest/globals';
import {
  resolveAuthContext,
  getContextFromType,
  isOriginAllowedForContext,
  getValidContexts,
  isValidContextType,
} from '../src/contextUtils.js';

describe('Context Utils', () => {
  describe('resolveAuthContext', () => {
    test('should resolve context from origin header', () => {
      const req = {
        headers: {
          origin: 'https://customer.bizpickr.cloud',
        },
      };

      const context = resolveAuthContext(req);
      expect(context).toBe('customer');
    });

    test('should return null for invalid origin', () => {
      const req = {
        headers: {
          origin: 'https://invalid.com',
        },
      };

      const context = resolveAuthContext(req);
      expect(context).toBeNull();
    });
  });

  describe('getContextFromType', () => {
    test('should map valid type to context', () => {
      expect(getContextFromType('customer')).toBe('customer');
      expect(getContextFromType('vendor')).toBe('vendor');
      expect(getContextFromType('admin')).toBe('admin');
    });

    test('should return null for invalid type', () => {
      expect(getContextFromType('invalid')).toBeNull();
      expect(getContextFromType(null)).toBeNull();
    });
  });

  describe('isOriginAllowedForContext', () => {
    test('should validate allowed origin', () => {
      const allowed = isOriginAllowedForContext(
        'https://customer.bizpickr.cloud',
        'customer'
      );
      expect(allowed).toBe(true);
    });

    test('should reject invalid origin', () => {
      const allowed = isOriginAllowedForContext(
        'https://invalid.com',
        'customer'
      );
      expect(allowed).toBe(false);
    });
  });

  describe('getValidContexts', () => {
    test('should return all valid contexts', () => {
      const contexts = getValidContexts();
      expect(contexts).toContain('customer');
      expect(contexts).toContain('vendor');
      expect(contexts).toContain('admin');
    });
  });

  describe('isValidContextType', () => {
    test('should validate context types', () => {
      expect(isValidContextType('customer')).toBe(true);
      expect(isValidContextType('vendor')).toBe(true);
      expect(isValidContextType('admin')).toBe(true);
      expect(isValidContextType('invalid')).toBe(false);
    });
  });
});
