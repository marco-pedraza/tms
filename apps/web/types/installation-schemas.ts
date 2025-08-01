/**
 * Local type definitions for installation schemas
 * This avoids import issues with the IMS client namespace
 */

export enum InstallationSchemaFieldType {
  STRING = 'string',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
}

export interface InstallationSchemaOptions {
  enumValues?: string[];
}

export interface InstallationSchema {
  id: number;
  name: string;
  description: string | null;
  type: InstallationSchemaFieldType;
  options: InstallationSchemaOptions;
  required: boolean;
  installationTypeId: number;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export interface ListInstallationSchemasResult {
  data: InstallationSchema[];
}
