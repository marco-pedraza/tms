# Base Repository

Este paquete proporciona un repositorio base con operaciones CRUD genéricas para trabajar con entidades de base de datos usando Drizzle ORM.

## Configuración de Tests

Para ejecutar los tests, necesitas una base de datos PostgreSQL. Puedes usar Docker para crear una instancia:

```bash
# Inicia la base de datos PostgreSQL usando Docker
docker-compose up -d

# Ejecuta los tests
npm test

# Ejecuta los tests en modo watch
npm run test:watch

# Ejecuta los tests con cobertura
npm run test:coverage
```

### Variables de entorno para tests

Los tests utilizan las siguientes variables de entorno (con valores predeterminados):

- `TEST_DB_HOST`: Host de la base de datos (default: localhost)
- `TEST_DB_PORT`: Puerto de la base de datos (default: 5432)
- `TEST_DB_NAME`: Nombre de la base de datos (default: base_repo_test)
- `TEST_DB_USER`: Usuario de la base de datos (default: postgres)
- `TEST_DB_PASSWORD`: Contraseña de la base de datos (default: postgres)

Si estás usando el docker-compose incluido, los tests están configurados para conectarse en el puerto 5433 por defecto para evitar conflictos con instancias locales.

## Estructura de Tests

- `tests/schemas/`: Contiene las tablas y tipos utilizados en los tests
- `tests/helpers/`: Contiene utilidades para conectar y resetear la base de datos
- `tests/*.test.ts`: Archivos de test

## Personalización

Para añadir nuevas tablas de test, edita el archivo `tests/schemas/test-tables.ts` y actualiza la función `cleanDatabase()` en `tests/helpers/reset-db.ts`.
