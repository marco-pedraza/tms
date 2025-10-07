import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/inventory/db-service';
import { installationSchemas } from '@/inventory/locations/installation-schemas/installation-schemas.schema';
import { installationTypes } from '@/inventory/locations/installation-types/installation-types.schema';

/**
 * Seeds the TOLLBOOTH installation type and its required schemas
 * This function is idempotent and can be run multiple times safely
 */
export async function seedTollbooths(): Promise<void> {
  console.log('🌱 Seeding TOLLBOOTH installation type...');

  // Check if TOLLBOOTH type already exists
  let tollboothType = await db.query.installationTypes.findFirst({
    where: and(
      eq(installationTypes.code, 'TOLLBOOTH'),
      isNull(installationTypes.deletedAt),
    ),
  });

  if (tollboothType) {
    console.log(
      `  ℹ️  TOLLBOOTH type already exists (id: ${tollboothType.id})`,
    );

    // Update to ensure systemLocked is true
    await db
      .update(installationTypes)
      .set({
        systemLocked: true,
        active: true,
      })
      .where(eq(installationTypes.id, tollboothType.id));
  } else {
    // Create new TOLLBOOTH type
    const [newType] = await db
      .insert(installationTypes)
      .values({
        code: 'TOLLBOOTH',
        name: 'Caseta de Peaje',
        description: 'Caseta de cobro de peaje en carreteras',
        systemLocked: true,
        active: true,
      })
      .returning();

    tollboothType = newType;
    console.log(`  ✓ TOLLBOOTH type created (id: ${tollboothType.id})`);
  }

  // Ensure tollboothType is defined
  if (!tollboothType) {
    throw new Error('Failed to create or retrieve TOLLBOOTH installation type');
  }

  // Define required schemas
  const schemas = [
    {
      name: 'toll_price',
      description: 'Precio del peaje en pesos',
      type: 'number',
      required: true,
    },
    {
      name: 'iave_enabled',
      description: 'Indica si el peaje acepta pago con IAVE',
      type: 'boolean',
      required: true,
    },
    {
      name: 'iave_provider',
      description: 'Proveedor del sistema IAVE (opcional)',
      type: 'string',
      required: false,
    },
  ];

  // Upsert each schema
  for (const schema of schemas) {
    const existingSchema = await db.query.installationSchemas.findFirst({
      where: and(
        eq(installationSchemas.installationTypeId, tollboothType.id),
        eq(installationSchemas.name, schema.name),
        isNull(installationSchemas.deletedAt),
      ),
    });

    if (existingSchema) {
      // Update existing schema
      await db
        .update(installationSchemas)
        .set({
          description: schema.description,
          type: schema.type,
          required: schema.required,
          systemLocked: true,
          options: {},
        })
        .where(eq(installationSchemas.id, existingSchema.id));

      console.log(`  ✓ Schema '${schema.name}' updated`);
    } else {
      // Create new schema
      await db.insert(installationSchemas).values({
        installationTypeId: tollboothType.id,
        name: schema.name,
        description: schema.description,
        type: schema.type,
        required: schema.required,
        systemLocked: true,
        options: {},
      });

      console.log(`  ✓ Schema '${schema.name}' created`);
    }
  }

  console.log('✅ TOLLBOOTH seeding completed.\n');
}
