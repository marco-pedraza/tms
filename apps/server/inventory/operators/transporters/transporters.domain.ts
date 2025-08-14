import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { transporters } from './transporters.schema';
import type {
  CreateTransporterPayload,
  UpdateTransporterPayload,
} from './transporters.types';
import { transporterRepository } from './transporters.repository';

export async function validateTransporterUniqueness(
  payload: CreateTransporterPayload | UpdateTransporterPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  const fieldsToCheck = [] as {
    field: typeof transporters.code | typeof transporters.name;
    value: unknown;
  }[];

  if (payload.code) {
    fieldsToCheck.push({ field: transporters.code, value: payload.code });
  }

  if (payload.name) {
    fieldsToCheck.push({ field: transporters.name, value: payload.name });
  }

  if (fieldsToCheck.length === 0) {
    return collector;
  }

  const conflicts = await transporterRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Transporter',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

export async function validateTransporter(
  payload: CreateTransporterPayload | UpdateTransporterPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateTransporterUniqueness(payload, currentId);
  validator.throwIfErrors();
}
