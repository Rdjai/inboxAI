# JWT Validation Middleware Guide

## Overview

The enhanced JWT validation middleware provides comprehensive security features, improved error handling, and advanced token management capabilities for the InboxFlow application.

## Features

### 1. Enhanced Token Validation
- **Format Validation**: Validates token structure and format
- **Signature Verification**: Verifies JWT signature with secret key
- **Payload Validation**: Validates token payload structure and fields
- **User Validation**: Checks if user exists and is active
- **Blacklist Checking**: Validates against token blacklist

### 2. Security Features
- **Token Blacklisting**: Invalidate tokens on logout or security events
- **Payload Validation**: Validates all required payload fields
- **Timestamp Validation**: Checks token age and expiration
- **User Status Checks**: Validates user account status
- **Email Verification**: Optional email verification requirement

### 3. Performance Optimizations
- **User Caching**: Caches user data to reduce database queries
- **Blacklist Cleanup**: Automatic cleanup of expired blacklist entries
- **Metrics Tracking**: Tracks validation statistics

### 4. Comprehensive Error Handling
- **Detailed Error Codes**: Specific error codes for debugging
- **HTTP Status Codes**: Appropriate status codes for each error type
- **Logging**: Comprehensive error logging

## API Reference

### JWTValidationMiddleware Class

#### Methods

##### `validateToken(token, options)`
Validates a JWT token with comprehensive checks.

**Parameters:**
- `token` (string): The JWT token to validate
- `options` (object): Validation options
  - `skipBlacklist` (boolean): Skip blacklist check (default: false)
  - `skipUserCheck` (boolean): Skip user validation (default: false)
  - `requireEmailVerified` (boolean): Require email verification (default: false)

**Returns:**
```javascript
{
    valid: boolean,
    error?: string,
    code?: string,
    decoded?: object,
    user?: object,
    token?: string
}
```

**Error Codes:**
- `INVALID_FORMAT`: Invalid token format
- `INVALID_PREFIX`: Missing Bearer prefix
- `TOKEN_TOO_SHORT`: Token is too short
- `TOKEN_BLACKLISTED`: Token has been invalidated
- `TOKEN_EXPIRED`: Token has expired
- `INVALID_SIGNATURE`: Invalid token signature
- `TOKEN_NOT_YET_VALID`: Token is not valid yet
- `VERIFICATION_FAILED`: Token verification failed
- `INVALID_PAYLOAD`: Invalid token payload
- `MISSING_USER_ID`: Missing userId in token
- `INVALID_USER_ID_FORMAT`: Invalid userId format
- `MISSING_IAT`: Missing issued at timestamp
- `MISSING_EXP`: Missing expiration timestamp
- `TOKEN_TOO_OLD`: Token is too old
- `USER_NOT_FOUND`: User not found
- `ACCOUNT_DEACTIVATED`: Account is deactivated
- `ACCOUNT_LOCKED`: Account is locked
- `EMAIL_NOT_VERIFIED`: Email must be verified
- `VALIDATION_ERROR`: Token validation failed

##### `authMiddleware(req, res, next)`
Express middleware for authentication.

**Usage:**
```javascript
const { authMiddleware } = require('./middleware/auth.middleware');

router.use(authMiddleware);
```

##### `refreshMiddleware(req, res, next)`
Middleware for token refresh.

**Request Body:**
```json
{
    "refreshToken": "string"
}
```

**Response:**
```json
{
    "success": true,
    "accessToken": "string",
    "expiresIn": 3600
}
```

##### `invalidateTokenMiddleware(req, res, next)`
Middleware for token invalidation.

**Request Headers:**
- `Authorization`: Bearer token

**Response:**
```json
{
    "success": true,
    "message": "Token has been invalidated"
}
```

##### `validateTokenMiddleware(req, res, next)`
Middleware for token validation without user check.

**Usage:**
```javascript
const { validateTokenMiddleware } = require('./middleware/auth.middleware');

router.get('/public-endpoint', validateTokenMiddleware, handler);
```

##### `verifyTokenMiddleware(req, res, next)`
Middleware for token verification.

**Usage:**
```javascript
const { verifyTokenMiddleware } = require('./middleware/auth.middleware');

router.get('/protected-endpoint', verifyTokenMiddleware, handler);
```

##### `roleMiddleware(...roles)`
Middleware for role-based access control.

**Parameters:**
- `...roles`: Allowed roles

**Usage:**
```javascript
const { roleMiddleware } = require('./middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

router.get('/admin-endpoint', roleMiddleware(ROLES.ADMIN), handler);
```

##### `permissionMiddleware(...permissions)`
Middleware for permission-based access control.

**Parameters:**
- `...permissions`: Required permissions

**Usage:**
```javascript
const { permissionMiddleware } = require('./middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

router.get('/emails', permissionMiddleware(PERMISSIONS.EMAIL_VIEW), handler);
```

##### `requireAllPermissions(...permissions)`
Middleware requiring all specified permissions.

**Parameters:**
- `...permissions`: Required permissions

**Usage:**
```javascript
const { requireAllPermissions } = require('./middleware/auth.middleware');

router.post('/sensitive-action', requireAllPermissions(PERMISSIONS.USER_CREATE, PERMISSIONS.USER_ROLE_CHANGE), handler);
```

##### `adminOnly(req, res, next)`
Middleware for admin-only access.

**Usage:**
```javascript
const { adminOnly } = require('./middleware/auth.middleware');

router.delete('/admin-action', adminOnly, handler);
```

##### `resourceOwnership(resourceField, permission)`
Middleware for resource ownership validation.

**Parameters:**
- `resourceField` (string): Field containing resource owner ID (default: 'assignedUserId')
- `permission` (string): Permission to check for "all" access (default: PERMISSIONS.EMAIL_VIEW_ALL)

**Usage:**
```javascript
const { resourceOwnership } = require('./middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

router.get('/emails/:id', resourceOwnership('userId', PERMISSIONS.EMAIL_VIEW_ALL), handler);
```

##### `conditionalPermission(conditions)`
Middleware for conditional permission checks.

**Parameters:**
- `conditions`: Array of condition objects
  - `when(req)`: Function that returns true if condition applies
  - `permissions`: Array of required permissions

**Usage:**
```javascript
const { conditionalPermission } = require('./middleware/auth.middleware');

const conditions = [
    {
        when: (req) => req.method === 'POST',
        permissions: [PERMISSIONS.EMAIL_CREATE]
    },
    {
        when: (req) => req.method === 'GET',
        permissions: [PERMISSIONS.EMAIL_VIEW]
    }
];

router.all('/emails', conditionalPermission(conditions), handler);
```

### Token Blacklist Methods

##### `blacklistToken(token, ttl)`
Blacklist a token.

**Parameters:**
- `token` (string): Token to blacklist
- `ttl` (number): Time to live in milliseconds (default: 3600000)

##### `unblacklistToken(token)`
Remove token from blacklist.

**Parameters:**
- `token` (string): Token to unblacklist

##### `cleanupBlacklist()`
Clean up expired blacklist entries.

**Returns:** Number of cleaned entries

### Metrics Methods

##### `getMetrics()`
Get validation metrics.

**Returns:**
```javascript
{
    validTokens: number,
    invalidTokens: number,
    expiredTokens: number,
    blacklistedTokens: number,
    userNotFound: number,
    deactivatedAccounts: number,
    total: number,
    validRate: string,
    invalidRate: string,
    blacklistCount: number
}
```

##### `resetMetrics()`
Reset validation metrics.

## Usage Examples

### Basic Authentication
```javascript
const express = require('express');
const { authMiddleware } = require('./middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/protected', (req, res) => {
    res.json({ message: 'Access granted', user: req.user });
});
```

### Role-Based Access
```javascript
const { roleMiddleware } = require('./middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

router.get('/admin', roleMiddleware(ROLES.ADMIN), adminHandler);
router.get('/editor', roleMiddleware(ROLES.EDITOR, ROLES.ADMIN), editorHandler);
```

### Permission-Based Access
```javascript
const { permissionMiddleware } = require('./middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

router.get('/emails', permissionMiddleware(PERMISSIONS.EMAIL_VIEW), listEmails);
router.post('/emails', permissionMiddleware(PERMISSIONS.EMAIL_CREATE), createEmail);
router.delete('/emails/:id', permissionMiddleware(PERMISSIONS.EMAIL_DELETE), deleteEmail);
```

### Token Refresh
```javascript
const { refreshMiddleware } = require('./middleware/auth.middleware');

router.post('/refresh', refreshMiddleware);
```

### Token Invalidation
```javascript
const { invalidateTokenMiddleware } = require('./middleware/auth.middleware');

router.post('/logout', invalidateTokenMiddleware, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
```

### Resource Ownership
```javascript
const { resourceOwnership } = require('./middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

router.get('/emails/:id', resourceOwnership('userId', PERMISSIONS.EMAIL_VIEW_ALL), getEmail);
```

### Conditional Permissions
```javascript
const { conditionalPermission } = require('./middleware/auth.middleware');

const conditions = [
    {
        when: (req) => req.method === 'POST',
        permissions: [PERMISSIONS.EMAIL_CREATE]
    },
    {
        when: (req) => req.method === 'PUT',
        permissions: [PERMISSIONS.EMAIL_EDIT]
    },
    {
        when: (req) => req.method === 'DELETE',
        permissions: [PERMISSIONS.EMAIL_DELETE]
    }
];

router.all('/emails/:id', conditionalPermission(conditions), handler);
```

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600

# Token Blacklist TTL (milliseconds)
TOKEN_BLACKLIST_TTL=3600000
```

### Token Payload Structure
```javascript
{
    userId: "MongoDB ObjectId",
    role: "admin|editor|member",
    iat: 1234567890,  // Issued at timestamp
    exp: 1234567890,  // Expiration timestamp
    isRefreshToken: false  // Optional, for refresh tokens
}
```

## Security Best Practices

### 1. Token Expiration
- Set appropriate expiration times
- Use shorter TTLs for sensitive operations
- Implement token refresh mechanism

### 2. Token Blacklisting
- Blacklist tokens on logout
- Implement automatic cleanup
- Monitor blacklist size

### 3. User Validation
- Always validate user exists
- Check account status
- Validate email verification if required

### 4. Error Handling
- Log all validation errors
- Use appropriate HTTP status codes
- Avoid leaking sensitive information

### 5. Rate Limiting
- Implement rate limiting on auth endpoints
- Monitor for suspicious activity
- Block repeated failures

## Monitoring

### Metrics Endpoints
```javascript
// Get validation metrics
const metrics = jwtValidation.getMetrics();

// Reset metrics
jwtValidation.resetMetrics();
```

### Log Messages
- `Token blacklisted: ...` - Token has been invalidated
- `User not found for token: ...` - User validation failed
- `Deactivated account used: ...` - Deactivated account access attempt
- `Locked account used: ...` - Locked account access attempt

## Troubleshooting

### Common Issues

**1. Token Expired**
- Error: `Token has expired`
- Solution: Implement token refresh mechanism

**2. User Not Found**
- Error: `User not found`
- Solution: Check user exists in database

**3. Account Deactivated**
- Error: `Account is deactivated`
- Solution: Reactivate user account

**4. Invalid Signature**
- Error: `Invalid token signature`
- Solution: Verify JWT_SECRET is correct

**5. Blacklisted Token**
- Error: `Token has been invalidated`
- Solution: User has logged out or token was invalidated

## Performance Considerations

### Caching
- User data is cached for 5 minutes
- Blacklist entries are cleaned up automatically
- Metrics are stored in memory

### Optimization Tips
1. Use `skipUserCheck` for public endpoints
2. Implement token refresh to reduce validation load
3. Monitor blacklist size and cleanup regularly
4. Use appropriate TTL values

## Migration Guide

### From Old Middleware
1. Import new middleware:
   ```javascript
   const { authMiddleware } = require('./middleware/auth.middleware');
   ```

2. Update routes to use new middleware
3. Update error handling to use new error codes
4. Implement token refresh mechanism
5. Update frontend to handle new error responses

## Support

For questions or issues with JWT validation:

1. Check error codes and messages
2. Review validation metrics
3. Check logs for detailed errors
4. Verify JWT_SECRET configuration
5. Test token format and structure

The enhanced JWT validation middleware provides comprehensive security features while maintaining backward compatibility with existing code.