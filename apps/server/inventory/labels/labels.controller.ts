import { api } from 'encore.dev/api';
import type {
  CreateLabelPayload,
  Label,
  LabelWithNodeCount,
  LabelsMetrics,
  ListLabelsQueryParams,
  ListLabelsResult,
  PaginatedListLabelsQueryParams,
  PaginatedListLabelsResult,
  UpdateLabelPayload,
} from './labels.types';
import { labelRepository } from './labels.repository';
import { validateLabel } from './labels.domain';

/**
 * Creates a new label.
 * @param params - The label data to create
 * @returns {Promise<Label>} The created label
 * @throws {APIError} If the label creation fails
 */
export const createLabel = api(
  { expose: true, method: 'POST', path: '/labels/create' },
  async (params: CreateLabelPayload): Promise<Label> => {
    await validateLabel(params);
    return await labelRepository.create(params);
  },
);

/**
 * Updates an existing label.
 * @param params - The label ID and data to update
 * @returns {Promise<Label>} The updated label
 * @throws {APIError} If the label update fails or label is not found
 */
export const updateLabel = api(
  { expose: true, method: 'PUT', path: '/labels/:id/update' },
  async ({
    id,
    ...data
  }: { id: number } & UpdateLabelPayload): Promise<Label> => {
    await validateLabel(data, id);
    return await labelRepository.update(id, data);
  },
);

/**
 * Deletes a label by ID.
 * @param params - Object containing the label ID to delete
 * @returns {Promise<Label>} The deleted label
 * @throws {APIError} If the label is not found
 */
export const deleteLabel = api(
  { expose: true, method: 'DELETE', path: '/labels/:id/delete' },
  async ({ id }: { id: number }): Promise<Label> => {
    return await labelRepository.delete(id);
  },
);

/**
 * Retrieves a single label by ID with node count.
 * @param params - Object containing the label ID to retrieve
 * @returns {Promise<LabelWithNodeCount>} The label with node count
 * @throws {APIError} If the label is not found
 */
export const getLabel = api(
  { expose: true, method: 'GET', path: '/labels/:id' },
  async ({ id }: { id: number }): Promise<LabelWithNodeCount> => {
    return await labelRepository.findOneWithNodeCount(id);
  },
);

/**
 * Lists all labels with optional filtering, searching, and ordering (paginated).
 * @param params - Query parameters for filtering, searching, and pagination
 * @returns {Promise<PaginatedListLabelsResult>} Paginated list of labels with node count
 */
export const listLabelsPaginated = api(
  { expose: true, method: 'POST', path: '/labels/list' },
  async (
    params: PaginatedListLabelsQueryParams,
  ): Promise<PaginatedListLabelsResult> => {
    return await labelRepository.findAllPaginatedWithNodeCount(params);
  },
);

/**
 * Lists all labels with optional filtering, searching, and ordering (non-paginated).
 * @param params - Query parameters for filtering, searching, and ordering
 * @returns {Promise<ListLabelsResult>} List of all labels with node count
 */
export const listLabels = api(
  { expose: true, method: 'POST', path: '/labels/list/all' },
  async (params: ListLabelsQueryParams): Promise<ListLabelsResult> => {
    const labels = await labelRepository.findAllWithNodeCount(params);
    return { data: labels };
  },
);

/**
 * Gets metrics data for labels dashboard.
 * @returns {Promise<LabelsMetrics>} Metrics including total labels, labels in use, and most used label info
 */
export const getLabelsMetrics = api(
  { expose: true, method: 'GET', path: '/labels/metrics' },
  async (): Promise<LabelsMetrics> => {
    return await labelRepository.getMetrics();
  },
);
