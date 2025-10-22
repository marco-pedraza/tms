---
description: Automatically add permissions for backend endpoints and/or frontend routes to a module
argument-hint: [folder-path]
---

# Add Permissions Command

Automatically add permissions for backend endpoints and/or frontend routes to a module in the authorization system.

## Usage Examples

```bash
# Smart auto-detection - command infers backend/frontend/both automatically
/add-permissions apps/server/inventory/fleet/buses
/add-permissions apps/web/app/buses
/add-permissions apps/server/users/roles
```

## Parameters

- **folder-path**: Path to the module folder (auto-detects module name, service, routes, and permission type)

## Smart Permission Type Detection

The command automatically infers what type of permissions to add based on the path:

### Backend Paths (`apps/server/`)
**Detected**: Backend permissions only
- **Reason**: Path points to server-side controller
- **Action**: Add endpoint permissions, skip frontend routes
- **Example**: `apps/server/inventory/fleet/buses` → Backend only

### Frontend Paths (`apps/web/app/`)
**Detected**: Frontend permissions only  
- **Reason**: Path points to client-side route
- **Action**: Add route permissions, skip backend endpoints
- **Example**: `apps/web/app/buses` → Frontend only

### Ambiguous Cases (Always Ask User)
**Detected**: Both backend and frontend permissions
- **Reason**: Both components exist (controller + frontend folder)
- **Action**: Always show confirmation dialog to user
- **Example**: `apps/server/inventory/fleet/buses` + existing frontend folder → Ask user

### Confirmation Dialog Example
```text
🔍 Detected both backend and frontend components for 'inventory_buses':

Backend: apps/server/inventory/fleet/buses/buses.controller.ts
Frontend: apps/web/app/buses/

What permissions would you like to add?
1) Backend only (API endpoints)
2) Frontend only (routes)  
3) Both backend and frontend
4) Cancel

Enter choice (1-4): 
```

## What This Command Does

**Smart Auto-Detection Process:**
1. **Analyzes the provided path** to determine backend/frontend/both
2. **Checks for corresponding components** (controller ↔ route folder)
3. **Shows confirmation dialog** if both components exist and user didn't specify
4. **Auto-detects module name, service, and routes** based on folder structure
5. **Finds the corresponding controller** (backend) or route folder (frontend)
6. **Validates authentication requirements** for backend endpoints (see Authentication Validation below)
7. **Extracts all API endpoints** from the controller file (if backend)
8. **Adds module constant** to `MODULE_PERMISSIONS` in `apps/server/shared/permissions.ts`
9. **Maps endpoints** to the module in `ENDPOINT_TO_MODULES` (if backend)
10. **Maps frontend routes** to the module in `apps/web/utils/permissions.ts` (if frontend)
11. **Adds permission definition** to `group-permissions.seeder.ts` in the appropriate group
12. **Adds permission to admin role** in `roles.seeder.ts` under Administrator permissions
13. **Prompts user to run seeders manually** to create the permission in the database

## Authentication Validation

When adding backend permissions, the command validates that all endpoints have `auth: true` configured.

**Important**: If an endpoint doesn't explicitly define `auth: true`, it defaults to `false` and requires authentication to be added.

The command automatically detects and fixes endpoints missing authentication:

```text
⚠️  Found 1 endpoint(s) missing authentication:
- /buses/list/all (POST)

🔧 Adding auth: true to missing endpoints...
✅ Fixed /buses/list/all (POST)
```

**Default behavior**:
- `auth: true` → Endpoint requires authentication
- `auth: false` → Endpoint is public (explicitly configured)
- No `auth` property → Defaults to `false`, treated as missing authentication

## Decision Logic Flow

```text
1. Analyze provided path
   ├── apps/server/... → Check for frontend counterpart
   ├── apps/web/app/... → Check for backend counterpart  
   └── Other → Show error

2. Check for corresponding components
   ├── Backend only → Validate authentication → Add backend permissions
   ├── Frontend only → Add frontend permissions
   └── Both exist → Show confirmation dialog

3. Confirmation dialog (if both components exist)
   ├── User chooses backend → Validate authentication → Add backend permissions
   ├── User chooses frontend → Add frontend permissions
   ├── User chooses both → Validate authentication → Add both permissions
   └── User cancels → Exit

4. Authentication validation (backend only)
   ├── Check for auth: true on all endpoints
   ├── Detect endpoints with no auth property (defaults to false)
   └── Auto-fix by adding auth: true to missing endpoints

5. Execute permission creation/update
   ├── Backend: Extract ALL endpoints, map to module
   ├── Frontend: Map routes to module
   ├── Database: Add to group-permissions.seeder.ts (if new)
   ├── Database: Add to admin role in roles.seeder.ts (if new)
   └── Prompt user to run seeders manually
```

## Database Seeder Process

The command prepares permission creation in the database through two seeder files, but **requires manual execution**:

### 1. Group Permissions Seeder (`group-permissions.seeder.ts`)

**Purpose**: Defines permission groups and individual permissions
**Process**:
- Analyzes the module to determine the appropriate permission group
- Adds permission definition to the correct group in `PREDEFINED_PERMISSION_GROUPS`
- Groups are organized by system functionality (inventory_localities, inventory_fleet, users, etc.)

**Example for `inventory_buses`:**
```typescript
// Added to inventory_fleet group
{
  code: 'inventory_buses',
  name: 'Autobuses',
  description: 'Administra la flota de autobuses para el Sistema de Inventario de Autobuses',
}
```

### 2. Roles Seeder (`roles.seeder.ts`)

**Purpose**: Assigns permissions to roles, specifically the Administrator role
**Process**:
- Adds the new permission code to the Administrator role's permissions array
- Ensures admin users automatically have access to new permissions

**Example for `inventory_buses`:**
```typescript
// Added to Administrator role permissions
{
  name: 'Administrator',
  permissions: [
    // ... existing permissions
    'inventory_buses', // ← New permission added here
  ],
}
```

### 3. Manual Seeder Execution

**⚠️ Important**: After the command modifies the seeder files, you must manually execute the seeders:

1. **Reset the database first** (recommended)

2. **Run the user seeders**:
   ```bash
   npm run seed:users
   ```

**Why manual execution?**
- Ensures database consistency
- Allows user to control when changes are applied
- Prevents accidental database modifications
- Gives user time to review changes before applying

### 4. Permission Group Detection

The command automatically determines the correct group based on the module path:

- `apps/server/inventory/fleet/*` → `inventory_fleet` group
- `apps/server/inventory/locations/*` → `inventory_localities` group  
- `apps/server/inventory/operators/*` → `inventory_operators` group
- `apps/server/inventory/routing/*` → `inventory_routing` group
- `apps/server/users/*` → `users` group

## Route Mapping

The command automatically maps these route patterns:
- `/{route}` - Main listing page
- `/{route}/new` - Create new item page  
- `/{route}/[id]` - View item details page
- `/{route}/[id]/edit` - Edit item page

## Examples

```bash
# New module (with authentication validation)
/add-permissions apps/server/inventory/fleet/buses

# Update existing module (after adding new endpoints)
/add-permissions apps/server/inventory/fleet/buses

# Frontend only
/add-permissions apps/web/app/buses
```

## Files Modified

**Backend permissions:**
- `apps/server/shared/permissions.ts` - Backend permission mappings
- `apps/server/db/scripts/seeders/group-permissions.seeder.ts` - Permission definition in appropriate group
- `apps/server/db/scripts/seeders/roles.seeder.ts` - Permission added to Administrator role
- `{controller-file}` - Authentication configuration updated (if needed)
- Database - Permission created and assigned to admin role

**Frontend permissions:**
- `apps/web/utils/permissions.ts` - Frontend route mappings

**Note:** Files are modified based on detection:
- Backend only: Backend files + database seeders + controller authentication (if needed)
- Frontend only: Frontend files + database seeders  
- Both: All files + database seeders + controller authentication (if needed)


## Verification

After running the command:

**Backend permissions:**
- **Endpoints**: Require the new permission for access
- **Authentication**: All endpoints have `auth: true`
- **Database**: Permission exists and is assigned to admin role (after manual seeder execution)
- **Seeders**: Permission added to appropriate group and admin role (ready for manual execution)

**Frontend permissions:**
- **Routes**: Redirect to `/access-denied` without permission
- **Users**: Admin users automatically have access

**Complete permissions:**
- All of the above applies

## Error Handling

- **Path not found**: Suggests similar paths
- **Module exists**: Updates existing mappings
- **Authentication issues**: Automatically fixes missing auth: true
- **Database not updated**: Reminds user to run seeders manually

## Security

- **Authentication required**: All backend endpoints must have `auth: true` explicitly defined
- **Default behavior**: Endpoints without `auth` property default to `false` (public access)
- **Auto-fix**: Command automatically adds `auth: true` to endpoints missing authentication
- **Fail-secure**: Missing mappings deny access by default
- **Admin bypass**: System admins have full access automatically
- **Audit trail**: All permission changes are logged
- **Least privilege**: Only necessary permissions are created
- **Manual database control**: User controls when database changes are applied
