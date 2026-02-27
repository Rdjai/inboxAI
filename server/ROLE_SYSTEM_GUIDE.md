# Role-Based Access Control System Guide

## Overview

The InboxFlow application now features a comprehensive Role-Based Access Control (RBAC) system that provides fine-grained permissions management. This system replaces the previous simple role checks with a sophisticated permission-based approach.

## Role Hierarchy

The system defines the following roles in order of increasing permissions:

1. **Member** (Level 1) - Basic user with limited permissions
2. **Agent** (Level 2) - Legacy role, equivalent to enhanced Member
3. **Editor** (Level 3) - Content manager with advanced permissions
4. **Reviewer** (Level 4) - Legacy role, equivalent to Editor with review permissions
5. **Admin** (Level 5) - Full system access

### Role Descriptions

#### Member
- **Purpose**: Standard users who handle their own emails
- **Capabilities**:
  - View and create emails
  - Edit own content
  - Basic search functionality
  - View own profile
  - Access assigned emails

#### Editor
- **Purpose**: Content managers who can handle multiple users' emails
- **Capabilities**:
  - All Member capabilities
  - Manage emails across the system
  - Create and edit user accounts
  - Approve and assign emails
  - Access analytics and reports
  - Manage email accounts
  - Advanced search and analytics

#### Admin
- **Purpose**: System administrators with full access
- **Capabilities**:
  - All Editor capabilities
  - Manage all users and roles
  - Access system settings and logs
  - Export and backup data
  - System maintenance and monitoring
  - Full email management capabilities

#### Legacy Roles
- **Agent**: Mapped to Member with additional permissions
- **Reviewer**: Mapped to Editor with review-specific permissions

## Permission System

### Permission Categories

#### Email Management
- `email:view` - View own emails
- `email:view:all` - View all emails in system
- `email:create` - Create new emails
- `email:edit` - Edit own emails
- `email:edit:all` - Edit any email
- `email:delete` - Delete own emails
- `email:delete:all` - Delete any email
- `email:approve` - Approve emails for sending
- `email:send` - Send approved emails
- `email:assign` - Assign emails to users
- `email:bulk` - Perform bulk operations

#### Search & Analytics
- `search:basic` - Basic search functionality
- `search:advanced` - Advanced search with filters
- `search:analytics` - Access search analytics
- `search:metrics` - View search performance metrics

#### User Management
- `user:view` - View own profile
- `user:view:all` - View all user profiles
- `user:create` - Create new users
- `user:edit` - Edit own profile
- `user:edit:all` - Edit any user profile
- `user:delete` - Delete users
- `user:role:change` - Change user roles

#### Account Management
- `account:view` - View own email accounts
- `account:view:all` - View all email accounts
- `account:create` - Create email accounts
- `account:edit` - Edit email accounts
- `account:delete` - Delete email accounts

#### System Administration
- `system:settings` - Access system settings
- `system:logs` - View system logs
- `system:metrics` - View system metrics
- `system:backup` - Perform backups
- `system:maintenance` - System maintenance

#### Analytics & Reporting
- `analytics:view` - View analytics dashboards
- `analytics:export` - Export analytics data
- `reports:create` - Create custom reports
- `reports:schedule` - Schedule automated reports

## API Usage

### Authentication Middleware

```javascript
const { authMiddleware } = require('../middleware/auth.middleware');

// Apply to all routes that need authentication
router.use(authMiddleware);
```

### Permission-Based Access Control

```javascript
const { permissionMiddleware } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../utils/constants');

// Require specific permission
router.get('/emails', 
    permissionMiddleware(PERMISSIONS.EMAIL_VIEW),
    emailController.getAllEmails
);

// Require any of multiple permissions
router.post('/emails/bulk',
    permissionMiddleware(PERMISSIONS.EMAIL_BULK_ACTIONS, PERMISSIONS.EMAIL_EDIT_ALL),
    emailController.bulkAction
);
```

### Resource Ownership

```javascript
const { resourceOwnership } = require('../middleware/auth.middleware');

// Users can only access their own emails unless they have view:all permission
router.get('/emails/:id',
    resourceOwnership('assignedUserId', PERMISSIONS.EMAIL_VIEW_ALL),
    emailController.getEmailById
);
```

### Admin-Only Access

```javascript
const { adminOnly } = require('../middleware/auth.middleware');

router.delete('/system/reset',
    adminOnly,
    systemController.resetSystem
);
```

### User Permission Helpers

In controllers, you can check permissions using helper methods:

```javascript
// Check single permission
if (req.user.hasPermission(PERMISSIONS.EMAIL_APPROVE)) {
    // User can approve emails
}

// Check multiple permissions (any)
if (req.user.hasAnyPermission([PERMISSIONS.EMAIL_EDIT, PERMISSIONS.EMAIL_EDIT_ALL])) {
    // User can edit emails
}

// Check multiple permissions (all required)
if (req.user.hasAllPermissions([PERMISSIONS.USER_CREATE, PERMISSIONS.USER_ROLE_CHANGE])) {
    // User can create users and change roles
}

// Check role management capability
if (req.user.canManageRole('editor')) {
    // User can manage editor role
}
```

## Migration Guide

### Automatic Migration

Run the migration script to update existing users:

```bash
# Dry run to see what would change
node src/scripts/migrateUserRoles.js --dry-run

# Actual migration
node src/scripts/migrateUserRoles.js

# Rollback if needed
node src/scripts/migrateUserRoles.js --rollback
```

### Manual Role Updates

Use the user management API to update roles:

```javascript
// Change user role
PUT /api/users/:id/role
{
    "newRole": "editor",
    "reason": "Promotion to content manager"
}
```

## Best Practices

### 1. Principle of Least Privilege
- Assign the minimum role necessary for users to perform their tasks
- Regularly review and audit user permissions
- Use resource ownership checks for sensitive operations

### 2. Permission Checking
- Always check permissions at the API level, not just in the UI
- Use specific permissions rather than role checks when possible
- Implement resource ownership for user-specific data

### 3. Role Management
- Document role changes with reasons
- Use the role hierarchy to determine management capabilities
- Implement approval workflows for role changes

### 4. Security Considerations
- Validate all role transitions
- Log all permission changes
- Implement session invalidation on role changes
- Use HTTPS for all authentication endpoints

## API Endpoints

### User Management

```
GET    /api/users                    # List users (with permission filtering)
POST   /api/users                    # Create user
GET    /api/users/:id                # Get user details
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user
PUT    /api/users/:id/role           # Change user role
POST   /api/users/bulk               # Bulk user operations
GET    /api/users/permissions        # Get current user permissions
```

### Role Information

```
GET    /api/users/roles              # List available roles
GET    /api/users/roles/:role        # Get role information
GET    /api/users/permissions/check  # Check specific permissions
```

## Error Handling

The system returns specific error codes for permission issues:

- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found or access denied

Error responses include:
- Required permissions
- User's current role
- Available permissions for debugging

## Testing

### Unit Tests

```javascript
const permissionService = require('../services/permission.service');

describe('Permission Service', () => {
    it('should check user permissions correctly', () => {
        const user = { role: 'editor' };
        expect(permissionService.hasPermission(user, 'email:edit')).toBe(true);
    });
});
```

### Integration Tests

```javascript
describe('Email API with Permissions', () => {
    it('should allow editors to view all emails', async () => {
        const token = await loginAs('editor');
        const response = await request(app)
            .get('/api/emails')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
```

## Monitoring and Auditing

### Permission Audit Logs

All permission-related actions are logged:

```javascript
{
    action: 'PERMISSION_GRANTED',
    userId: 'user123',
    permission: 'email:approve',
    resource: 'email456',
    timestamp: '2024-01-01T12:00:00Z',
    requestId: 'req789'
}
```

### Role Change Tracking

Role changes are tracked in user history:

```javascript
{
    previousRole: 'member',
    newRole: 'editor',
    changedAt: '2024-01-01T12:00:00Z',
    changedBy: 'admin123',
    reason: 'Promotion to content manager'
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user's current role and permissions
   - Verify resource ownership
   - Review permission requirements for the endpoint

2. **Role Migration Issues**
   - Run migration in dry-run mode first
   - Check migration logs for errors
   - Use rollback if needed

3. **Performance Issues**
   - Use permission caching for frequently checked permissions
   - Optimize database queries with proper indexing
   - Consider permission pre-computation for complex scenarios

### Debug Mode

Enable debug logging for permission checks:

```javascript
process.env.DEBUG_PERMISSIONS = 'true';
```

This will log all permission checks and their results.

## Future Enhancements

### Planned Features

1. **Dynamic Permissions**: Runtime permission assignment
2. **Permission Groups**: Grouping related permissions
3. **Conditional Permissions**: Time-based or context-based permissions
4. **Permission Inheritance**: Hierarchical permission structures
5. **API Rate Limiting**: Per-role rate limits

### Extension Points

The system is designed to be extensible:

- Add new permissions in `constants.js`
- Extend role definitions
- Implement custom permission logic
- Add new middleware for specific use cases

## Support

For questions or issues with the role system:

1. Check the error logs for specific permission failures
2. Review the user's role and permission assignments
3. Verify the API endpoint permission requirements
4. Test with different roles to isolate the issue

The role system provides comprehensive access control while maintaining flexibility for future enhancements.