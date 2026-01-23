# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-23

### Added
- Initial release
- Context resolution from request headers/origin
- Context-scoped cookie extraction utilities
- Token extraction with context awareness
- Support for multiple token types (access, refresh, signup, otp, password_reset)
- Backward compatibility with legacy cookie formats
- Comprehensive JSDoc documentation
- Zero dependencies
- Full TypeScript support via JSDoc types

### Features
- `extractToken()` - Unified token extraction with context awareness
- `resolveAuthContext()` - Context resolution from headers
- `extractContextToken()` - Context-specific token extraction
- `extractTokenFromAllContexts()` - Fallback token extraction
- `getCookieName()` - Cookie name generation
- `getContextFromType()` - Type to context mapping
- `isOriginAllowedForContext()` - Origin validation
- Custom context origins support
- Development mode header override support

[1.0.0]: https://github.com/rameshneel/bizpickr-auth-context/releases/tag/v1.0.0
