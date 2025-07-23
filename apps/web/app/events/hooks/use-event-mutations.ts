import type { event_types } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  event_types.EventType,
  event_types.CreateEventTypePayload
>({
  queryKey: ['events'],
  translationKey: 'eventTypes',
  createMutationFn: (payload) => imsClient.inventory.createEventType(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteEventType(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateEventType(id, payload),
  routes: routes.events,
});
