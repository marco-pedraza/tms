# Database Scripts

This directory contains database-related utility scripts for the server application.

## Available Scripts

### Seed Permissions

The `seed-permissions.ts` script automatically extracts all API endpoints from controllers and creates corresponding permission records in the database. The permissions follow the format `serviceName:endpointName` (e.g., `users:createUser`).

#### How It Works

1. The script scans all `*.controller.ts` files in the `apps/server` directory
2. It extracts exposed API endpoints (those with `expose: true`) 
3. For each endpoint, it creates a permission record with:
   - **Code**: `serviceName:endpointName` (e.g., `users:createUser`)
   - **Name**: A formatted name based on the service and endpoint (e.g., `Users - Create User`)
   - **Description**: The HTTP method, path, and auth requirement (e.g., `POST /users - Requires authentication`)

#### Running the Script

To run the script, use the following command from the `apps/server` directory:

```bash
npm run seed:permissions
```

This uses Encore's execution environment to ensure the database and other dependencies are properly initialized.

Alternatively, you can use the Encore CLI directly:

```bash
cd apps/server
encore exec -- npx tsx db/scripts/seed-permissions.ts
```

#### Expected Output

The script will output progress information as it extracts and creates permissions:

```
Starting permissions seeding...
Found 15 controller files
Processing users/permissions...
Processing inventory/countries...
...
Extracted 81 unique permissions
Created permission: users:createUser
Created permission: users:getUser
...
Permissions seeding completed!
```

#### Updating Permissions

If new endpoints are added to controllers, simply run the script again. It will:
- Skip existing permissions (you'll see "Permission already exists" in the logs)
- Create new permissions for newly discovered endpoints

This makes it easy to keep permissions in sync with your API as it evolves.

#### Implementation Details

The script uses TypeScript's compiler API to parse the controller files and extract API endpoints. It looks for:
- Variable declarations that use the `api` function
- Configuration objects with `expose: true` 
- Method, path, and auth properties

Only exposed endpoints get permissions generated, following the naming convention `serviceName:endpointName`. 