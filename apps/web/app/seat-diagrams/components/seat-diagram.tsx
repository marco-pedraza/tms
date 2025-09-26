'use client';

import React from 'react';
import { Minus, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SpaceType } from '@/services/ims-client';
import { cn } from '@/utils/cn';
import { SeatDiagramSpace } from '../seat-diagrams.schemas';
import DiagramSpace from './diagram-space/DiagramSpace';

/**
 * Calculate the maximum X and Y coordinates to determine grid size
 */
function calculateGridDimensions(spaces: SeatDiagramSpace[]): {
  maxX: number;
  maxY: number;
} {
  const maxX = Math.max(...spaces.map((space) => space.position.x));
  const maxY = Math.max(...spaces.map((space) => space.position.y));

  return { maxX, maxY };
}

/**
 * Create a map for O(1) position lookup: "x,y" -> space
 */
function createPositionMap(
  spaces: SeatDiagramSpace[],
): Map<string, SeatDiagramSpace> {
  const positionMap = new Map<string, SeatDiagramSpace>();

  spaces.forEach((space) => {
    const key = `${space.position.x},${space.position.y}`;
    positionMap.set(key, space);
  });

  return positionMap;
}

/**
 * Find the main hallway X coordinate (the X position with the most hallways)
 */
function findMainHallwayX(spaces: SeatDiagramSpace[]): number | null {
  const hallwaySpaces = spaces.filter(
    (space) => space.spaceType === SpaceType.HALLWAY,
  );

  if (hallwaySpaces.length === 0) {
    return null;
  }

  // Count hallways by X coordinate
  const hallwayCountByX = new Map<number, number>();
  hallwaySpaces.forEach((hallway) => {
    const x = hallway.position.x;
    hallwayCountByX.set(x, (hallwayCountByX.get(x) ?? 0) + 1);
  });

  // Find X coordinate with most hallways
  let maxCount = 0;
  let mainHallwayX: number | null = null;

  hallwayCountByX.forEach((count, x) => {
    if (count > maxCount) {
      maxCount = count;
      mainHallwayX = x;
    }
  });

  return mainHallwayX;
}

/**
 * Count columns before and after the hallway
 */
function countColumnsAroundHallway(
  spaces: SeatDiagramSpace[],
  mainHallwayX: number | null,
): { columnsBefore: number; columnsAfter: number } {
  if (mainHallwayX === null) {
    const totalColumns = new Set(spaces.map((space) => space.position.x)).size;
    return { columnsBefore: totalColumns, columnsAfter: 0 };
  }

  const uniqueXPositions = new Set(spaces.map((space) => space.position.x));

  const columnsBefore = Array.from(uniqueXPositions).filter(
    (x) => x < mainHallwayX,
  ).length;
  const columnsAfter = Array.from(uniqueXPositions).filter(
    (x) => x > mainHallwayX,
  ).length;

  return { columnsBefore, columnsAfter };
}

/**
 * Check if user can add a column before the hallway
 * Rule: Maximum 3 columns before hallway
 */
function canAddColumnBeforeHallway(
  spaces: SeatDiagramSpace[],
  mainHallwayX: number | null,
): boolean {
  const { columnsBefore } = countColumnsAroundHallway(spaces, mainHallwayX);
  return columnsBefore < 3;
}

/**
 * Check if user can add a column after the hallway
 * Rule: Maximum 3 columns after hallway
 */
function canAddColumnAfterHallway(
  spaces: SeatDiagramSpace[],
  mainHallwayX: number | null,
): boolean {
  const { columnsAfter } = countColumnsAroundHallway(spaces, mainHallwayX);
  return columnsAfter < 3;
}

/**
 * Check if user can remove a column before the hallway
 * Rule: Minimum 1 column before hallway, cannot remove hallway itself
 */
function canRemoveColumnBeforeHallway(
  spaces: SeatDiagramSpace[],
  columnX: number,
  mainHallwayX: number | null,
): boolean {
  // Cannot remove the main hallway column
  if (mainHallwayX !== null && columnX === mainHallwayX) {
    return false;
  }

  const { columnsBefore } = countColumnsAroundHallway(spaces, mainHallwayX);

  // If removing a column before the hallway, ensure minimum of 1 remains
  if (mainHallwayX !== null && columnX < mainHallwayX) {
    return columnsBefore > 1;
  }

  return true;
}

/**
 * Check if user can remove a column after the hallway
 * Rule: Minimum 0 columns after hallway (can remove all)
 */
function canRemoveColumnAfterHallway(
  spaces: SeatDiagramSpace[],
  columnX: number,
  mainHallwayX: number | null,
): boolean {
  // Cannot remove the main hallway column
  if (mainHallwayX !== null && columnX === mainHallwayX) {
    return false;
  }

  // Can always remove columns after hallway (min is 0)
  return true;
}

/**
 * Check if remove column button should be visible
 * Rule: Hide button when 0 columns after hallway
 */
function shouldShowRemoveColumnButton(
  spaces: SeatDiagramSpace[],
  isAfterHallway: boolean,
  mainHallwayX: number | null,
): boolean {
  if (!isAfterHallway) return true; // Always show for before hallway

  const { columnsAfter } = countColumnsAroundHallway(spaces, mainHallwayX);
  return columnsAfter > 0;
}

/**
 * Check if user can remove a row
 * Rule: Minimum 1 row
 */
function canRemoveRow(maxY: number): boolean {
  // Minimum of one row (maxY = 0 means 1 row)
  return maxY > 0;
}

/**
 * Generate grid rows with appropriate components
 */
function generateGridRows(
  positionMap: Map<string, SeatDiagramSpace>,
  maxX: number,
  maxY: number,
  onClick: (space: SeatDiagramSpace) => void,
  selectedSpace: SeatDiagramSpace | null,
): React.JSX.Element[] {
  const gridRows: React.JSX.Element[] = [];

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      const key = `${x},${y}`;
      const space = positionMap.get(key);

      if (!space) {
        // This should never happen, but we need to handle it
        continue;
      }

      gridRows.push(
        <div
          key={`${x}-${y}`}
          className="w-10 h-10 flex items-center justify-center"
        >
          <DiagramSpace
            space={space}
            onClick={onClick}
            isSelected={
              Boolean(selectedSpace?.spaceType) &&
              selectedSpace?.position.x === space.position.x &&
              selectedSpace?.position.y === space.position.y &&
              selectedSpace?.floorNumber === space.floorNumber
            }
          />
        </div>,
      );
    }
  }

  return gridRows;
}

interface SeatDiagramProps {
  spaces: SeatDiagramSpace[];
  floorNumber: number;
  onClick: (space: SeatDiagramSpace) => void;
  selectedSpace: SeatDiagramSpace | null;
  onAddColumn: (floorNumber: number, afterX: number) => void;
  onAddRow: (floorNumber: number) => void;
  onRemoveColumn: (floorNumber: number, columnX: number) => void;
  onRemoveRow: (floorNumber: number) => void;
}

/**
 * Renders a seat diagram based on spaces array
 * @param spaces - Array of space objects (seats, hallways, etc.)
 * @param floorNumber - Floor number to render
 * @returns JSX grid representation of the diagram
 */
export default function SeatDiagram({
  spaces,
  floorNumber,
  onClick,
  selectedSpace,
  onAddColumn,
  onAddRow,
  onRemoveColumn,
  onRemoveRow,
}: SeatDiagramProps) {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  // Step 1: Filter spaces for specific floor
  const floorSpaces = spaces.filter(
    (space) => space.floorNumber === floorNumber,
  );

  // Step 2: Calculate grid dimensions
  const { maxX, maxY } = calculateGridDimensions(floorSpaces);

  // Step 3: Create position map for O(1) lookup
  const positionMap = createPositionMap(floorSpaces);

  // Step 4: Find main hallway
  const mainHallwayX = findMainHallwayX(floorSpaces);

  // Step 5: Check business logic constraints
  const canAddColBefore = canAddColumnBeforeHallway(floorSpaces, mainHallwayX);
  const canAddColAfter = canAddColumnAfterHallway(floorSpaces, mainHallwayX);
  const canRemoveColBefore = canRemoveColumnBeforeHallway(
    floorSpaces,
    mainHallwayX ? mainHallwayX - 1 : 0,
    mainHallwayX,
  );
  const canRemoveColAfter = canRemoveColumnAfterHallway(
    floorSpaces,
    maxX,
    mainHallwayX,
  );
  const showRemoveColAfter = shouldShowRemoveColumnButton(
    floorSpaces,
    true,
    mainHallwayX,
  );
  const canRemoveRowCheck = canRemoveRow(maxY);

  // Step 6: Generate grid rows
  const gridRows = generateGridRows(
    positionMap,
    maxX,
    maxY,
    onClick,
    selectedSpace,
  );

  return (
    <div className="space-y-4 p-15 pr-0 w-full h-full overflow-x-auto justify-items-center-safe">
      <div className="relative">
        {/* Add Column button - positioned at the border, before main hallway */}
        {mainHallwayX !== null && (
          <div
            className="absolute -top-11 flex justify-center gap-2"
            style={{
              left: `${(mainHallwayX - 1) * 48 + 3}px`, // position before the main hallway
            }}
          >
            <Button
              variant="outline"
              size="icon"
              className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
              type="button"
              disabled={!canRemoveColBefore}
              onClick={() => {
                onRemoveColumn(floorNumber, mainHallwayX - 1);
              }}
              title={tSeatDiagrams(
                'form.placeholders.removeColumnBeforeHallway',
              )}
              aria-label={tSeatDiagrams(
                'form.placeholders.removeColumnBeforeHallway',
              )}
            >
              <Minus className="w-3 h-3 text-gray-400" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
              type="button"
              disabled={!canAddColBefore}
              onClick={() => {
                onAddColumn(floorNumber, mainHallwayX - 1);
              }}
              title={tSeatDiagrams('form.placeholders.addColumnBeforeHallway')}
              aria-label={tSeatDiagrams(
                'form.placeholders.addColumnBeforeHallway',
              )}
            >
              <PlusIcon className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        )}

        {/* Column buttons - at absolute rightmost position */}
        <div
          className="absolute -top-11 flex justify-center gap-2"
          style={{
            left: showRemoveColAfter
              ? `${maxX * 48 + 3}px`
              : `${maxX * 48 + 48}px`, // Position after the last column
          }}
        >
          {/* Only show remove button if there are columns after hallway */}
          <div className={cn(!showRemoveColAfter && 'hidden')}>
            <Button
              variant="outline"
              size="icon"
              className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
              type="button"
              disabled={!canRemoveColAfter}
              onClick={() => {
                onRemoveColumn(floorNumber, maxX);
              }}
              title={tSeatDiagrams(
                'form.placeholders.removeColumnAfterHallway',
              )}
              aria-label={tSeatDiagrams(
                'form.placeholders.removeColumnAfterHallway',
              )}
            >
              <Minus className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
            type="button"
            disabled={!canAddColAfter}
            onClick={() => {
              onAddColumn(floorNumber, maxX);
            }}
            title={tSeatDiagrams('form.placeholders.addColumnAfterHallway')}
            aria-label={tSeatDiagrams(
              'form.placeholders.addColumnAfterHallway',
            )}
          >
            <PlusIcon className="w-3 h-3 text-gray-400" />
          </Button>
        </div>

        <div
          className="grid gap-2 w-max h-full"
          style={{
            gridTemplateColumns: `repeat(${maxX + 1}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${maxY + 1}, minmax(0, 1fr))`,
          }}
        >
          {gridRows}
        </div>

        {/* Add Row button - positioned at the border, below the grid */}
        <div className="absolute -bottom-11 -left-2  transform -translate-x-2/2 flex flex-col justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
            type="button"
            disabled={!canRemoveRowCheck}
            onClick={() => {
              onRemoveRow(floorNumber);
            }}
            title={tSeatDiagrams('form.placeholders.removeRow')}
            aria-label={tSeatDiagrams('form.placeholders.removeRow')}
          >
            <Minus className="w-3 h-3 text-gray-400" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-dashed border-gray-400 bg-transparent hover:bg-gray-50 text-xs px-2 py-1"
            type="button"
            onClick={() => {
              onAddRow(floorNumber);
            }}
            title={tSeatDiagrams('form.placeholders.addRow')}
            aria-label={tSeatDiagrams('form.placeholders.addRow')}
          >
            <PlusIcon className="w-3 h-3 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
