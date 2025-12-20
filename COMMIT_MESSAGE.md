# Commit Message

## Summary (Short)
```
feat(permissions): refactor permissions management with role system, bulk import, and UI improvements
```

## Description (Detailed)

### Features Added
- **Role Management System**
  - Created Role model with score-based ordering
  - Added CRUD APIs for roles (`/admin/roles`)
  - Roles are now dynamically managed in database instead of hardcoded
  - Added seed script for default roles (guest, user, admin, super_admin)

- **Users Management Page**
  - New `/dashboard/users` page with tabs for users and roles management
  - User listing with search, filter by role, and pagination
  - Ability to change user roles
  - Role management with score-based sorting

- **Bulk Import JSON**
  - Added "Import JSON" button to Routes and APIs tables
  - Import multiple routes/APIs at once via JSON
  - Auto-skip duplicate entries
  - Validation and error handling

- **Code Refactoring**
  - Split large Permissions.jsx into smaller, maintainable components:
    - `components/RouteTable.jsx` - Routes table component
    - `components/ApiTable.jsx` - APIs table component
    - `components/HistoryTable.jsx` - History table component
    - `components/RouteModal.jsx` - Route add/edit modal
    - `components/ApiModal.jsx` - API add/edit modal
    - `components/BulkEditModal.jsx` - Bulk edit modal
    - `components/ImportJsonModal.jsx` - JSON import modal
    - `hooks/usePermissions.js` - Custom hook for data fetching
    - `utils/permissions.js` - Utility functions

### UI/UX Improvements
- Added description column to Routes and APIs tables
- Improved pagination with customizable page size (10/20/50/100 rows)
- Added pattern suggestions with AutoComplete for quick selection
- Right-aligned "Quyền truy cập" column for better readability
- Color-coded HTTP methods:
  - GET: Blue
  - POST: Green
  - PUT: Orange
  - DELETE: Red
  - PATCH: Purple
- Role tags sorted by score for consistent display
- Responsive layout using Ant Design Tabs

### Database Changes
- Removed hardcoded role enums from User, RoutePermission, ApiPermission models
- Roles are now managed dynamically via Role collection
- Added Role model with fields: name, displayName, score, description, color

### Files Added
- `client/src/app/pages/dashboard/permissions/components/RouteTable.jsx`
- `client/src/app/pages/dashboard/permissions/components/ApiTable.jsx`
- `client/src/app/pages/dashboard/permissions/components/HistoryTable.jsx`
- `client/src/app/pages/dashboard/permissions/components/RouteModal.jsx`
- `client/src/app/pages/dashboard/permissions/components/ApiModal.jsx`
- `client/src/app/pages/dashboard/permissions/components/BulkEditModal.jsx`
- `client/src/app/pages/dashboard/permissions/components/ImportJsonModal.jsx`
- `client/src/app/pages/dashboard/permissions/hooks/usePermissions.js`
- `client/src/app/pages/dashboard/permissions/utils/permissions.js`
- `client/src/app/pages/dashboard/Users.jsx`
- `server/src/models/Role.js`
- `server/src/scripts/seedRoles.js`
- `client/src/app/pages/dashboard/permissions/api-permissions-example.json`
- `client/src/app/pages/dashboard/permissions/route-permissions-example.json`

### Files Modified
- `client/src/app/pages/dashboard/Permissions.jsx` - Refactored to use new components
- `server/src/routes/admin.js` - Added roles and users management endpoints
- `server/src/models/User.js` - Removed hardcoded role enum
- `server/src/models/RoutePermission.js` - Removed hardcoded role enum
- `server/src/models/ApiPermission.js` - Removed hardcoded role enum
- `server/package.json` - Added seed:roles script
- `client/src/app/routes/routes.jsx` - Added /dashboard/users route

### Breaking Changes
- None (backward compatible)

### Migration Notes
- Run `npm run seed:roles` to seed default roles into database
- Existing users will keep their roles, but roles are now managed in Role collection
- Permissions page now requires super_admin role (unchanged)

