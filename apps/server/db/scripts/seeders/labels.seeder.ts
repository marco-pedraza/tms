import { db } from '../../../inventory/db-service';
import { labelNodes } from '../../../inventory/labels/labels.schema';
import { Label } from '../../../inventory/labels/labels.types';
import { Node } from '../../../inventory/nodes/nodes.types';
import { labelFactory } from '../../../tests/factories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Seeds labels
 */
export async function seedLabels(factoryDb: FactoryDb): Promise<Label[]> {
  const LABEL_COUNT = 15;
  const labelPayloads = Array.from({ length: LABEL_COUNT }, () => ({}));

  const labels = (await labelFactory(factoryDb).create(
    labelPayloads,
  )) as Label[];
  console.log(`Seeded ${labels.length} labels`);
  return labels;
}

/**
 * Seeds label-node associations
 */
export async function seedLabelNodes(
  labels: Label[],
  nodes: Node[],
): Promise<void> {
  // Filter out deleted and inactive labels
  const availableLabels = (
    labels as (Label & { deletedAt?: Date | string | null })[]
  ).filter((label) => label.active && !label.deletedAt);

  // If no available labels, exit early
  if (availableLabels.length === 0) {
    console.log('No active labels available for assignment');
    return;
  }

  // Create random label-node associations
  // Each node can have 0-3 labels, and each label can be associated with multiple nodes
  const labelNodeAssociations = [];

  for (const node of nodes) {
    // Random number of labels per node (0-3)
    const labelCount = Math.floor(Math.random() * 4); // 0 to 3 labels

    if (labelCount > 0) {
      // Select random labels for this node from available labels only
      const selectedLabels = availableLabels
        .sort(() => 0.5 - Math.random())
        .slice(0, labelCount);

      for (const label of selectedLabels) {
        labelNodeAssociations.push({
          labelId: label.id,
          nodeId: node.id,
        });
      }
    }
  }

  // Insert label-node associations
  if (labelNodeAssociations.length > 0) {
    await db.insert(labelNodes).values(labelNodeAssociations);
  }

  console.log(`Assigned labels to nodes`);
}
