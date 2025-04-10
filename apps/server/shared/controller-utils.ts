import { parseApiError } from './errors';
import log, { Logger } from 'encore.dev/log';

function logControllerError(
  logger: Logger,
  error: Error | unknown,
  controller: string,
  operation: string,
) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  logger.error('Request failed', {
    error_name: error instanceof Error ? error.name : 'Unknown',
    error_message: error instanceof Error ? error.message : 'Unknown error',
    controller,
    operation,
  });
}

/**
 * Creates an error handler for a specific controller
 * @param controller - The name of the controller
 * @returns A function that handles controller operations with error logging
 */
export function createControllerErrorHandler(controller: string) {
  return async function withErrorHandling<T>(
    operation: string,
    controllerHandler: () => Promise<T>,
  ): Promise<T> {
    const logger = log.with({ controller, operation });
    try {
      const result = await controllerHandler();
      return result;
    } catch (error) {
      logControllerError(logger, error, controller, operation);

      // If the error is already an APIError (from errors), rethrow it directly
      if (error instanceof Error && error.name === 'APIError') {
        throw error;
      }

      // Otherwise, parse it to the appropriate APIError
      throw parseApiError(error);
    }
  };
}
