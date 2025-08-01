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
import useUpdateInstallationPropertiesMutation from '@/nodes/hooks/use-update-installation-properties-mutation';
import routes from '@/services/routes';

export default function NewNodePage() {
  const router = useRouter();
  const { create: createNode } = useNodeMutations();
  const { create: createInstallation } = useInstallationMutations();
  const updateProperties = useUpdateInstallationPropertiesMutation();
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

    const installation = await createInstallation.mutateWithToast(
      { nodeId: node.id, ...values },
      {
        standalone: false,
        onError: () => {
          toast.info(tNodes('messages.syncIntallationError.create'));
          /**
           * If the installation creation fails,
           * We don't need to try to assign amenities or custom attributes
           * because those operations depend on the installation being created
           *
           * Thus, we can safely navigate to the edit page and let the user
           * try again.
           */
          router.push(routes.nodes.getEditRoute(node.id.toString()));
        },
      },
    );

    if (values.customAttributes) {
      await updateProperties.mutateWithToast(
        {
          id: installation.id,
          properties: Object.entries(values.customAttributes).map(
            ([key, value]) => ({
              name: key,
              value: String(value),
            }),
          ),
        },
        {
          standalone: false,
          onError: () => {
            toast.info(tNodes('messages.syncCustomAttributesError'));
          },
        },
      );
    }

    if (values.amenityIds?.length > 0) {
      await assignAmenities.mutateWithToast(
        {
          installationId: installation.id,
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
