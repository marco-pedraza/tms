'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/components/page-header';
import NodeForm, { NodeFormOutputValues } from '@/nodes/components/node-form';
import useInstallationAmenityMutations from '@/nodes/hooks/use-installation-amenity-mutations';
import useInstallationMutations from '@/nodes/hooks/use-installation-mutations';
import useNodeLabelMutations from '@/nodes/hooks/use-node-label-mutations';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import routes from '@/services/routes';

export default function NewNodePage() {
  const router = useRouter();
  const { create: createNode } = useNodeMutations();
  const { create: createInstallation } = useInstallationMutations();
  const { assignLabels } = useNodeLabelMutations();
  const { assignAmenities } = useInstallationAmenityMutations();
  const tNodes = useTranslations('nodes');

  const onSubmit = async (values: NodeFormOutputValues) => {
    const node = await createNode.mutateWithToast(values, {
      standalone: false,
    });

    // Assign labels if any were selected
    if (values.labelIds?.length > 0) {
      await assignLabels.mutateWithToast(
        {
          nodeId: node.id,
          labelIds: values.labelIds,
        },
        {
          standalone: false,
        },
      );
    }

    // Create installation if installationTypeId is provided
    if (values.installationTypeId) {
      const createdInstallation = await createInstallation.mutateWithToast(
        { nodeId: node.id, ...values },
        {
          standalone: false,
        },
      );

      // Assign amenities to the newly created installation if any were selected (optional operation)
      if (createdInstallation?.id && values.amenityIds?.length > 0) {
        await assignAmenities.mutateWithToast(
          {
            installationId: createdInstallation.id,
            amenityIds: values.amenityIds,
          },
          {
            standalone: false,
            onError: () => {
              // Show warning that amenity assignment failed but don't block navigation
              toast.warning(tNodes('messages.assignAmenities.error'));
            },
          },
        );
      }
    }

    // Navigate to the node details page regardless of installation/amenity assignment results
    router.push(routes.nodes.getDetailsRoute(node.id.toString()));
    return node;
  };

  return (
    <div>
      <PageHeader
        title={tNodes('actions.create')}
        description={tNodes('description')}
        backHref={routes.nodes.index}
        backLabel={tNodes('actions.backToList')}
      />
      <NodeForm onSubmit={onSubmit} />
    </div>
  );
}
